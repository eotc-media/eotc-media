import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fathersAdmin } from "@/lib/fathers-admin"
import { writeWorkText } from "@/lib/library"

// Import a library file made by scripts/fathers/to_bundle.py: each work's text
// goes to R2, its index (title, chapter titles and lengths) to the database,
// and the Books entries it names are pointed at it. Re-importing replaces a
// work's English text and refreshes its index; translations, notes and
// reading progress are never touched.

export const maxDuration = 300

interface ImportSection { position: number; title: string; words: number; paragraphs: string[] }
interface ImportWork {
  slug: string; collection: string; title: string; titleAm: string | null; short: string; shortAm: string | null
  author: string; authorAm: string | null; description: string; descriptionAm: string | null
  source: string; position: number; sections: ImportSection[]
}
interface ImportBook { id: number; match: string; work: string; range?: { from: number; to: number } }

const SLUG = /^[a-z0-9-]{1,80}$/
const str = (v: unknown, max: number) => (typeof v === "string" && v.length <= max ? v : null)

function validWork(w: Partial<ImportWork>): w is ImportWork {
  return !!w && typeof w.slug === "string" && SLUG.test(w.slug)
    && !!str(w.title, 300) && !!str(w.short, 200) && !!str(w.author, 200) && !!str(w.collection, 200)
    && typeof w.description === "string" && typeof w.source === "string" && Number.isInteger(w.position)
    && Array.isArray(w.sections) && w.sections.length > 0
    && w.sections.every((s, i) => s.position === i + 1 && !!str(s.title, 500) && Number.isInteger(s.words)
      && Array.isArray(s.paragraphs) && s.paragraphs.every(p => typeof p === "string"))
}

export async function POST(req: NextRequest) {
  if (!(await fathersAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => null)
  if (body?.format !== "eotc-library/1" || !Array.isArray(body.works)) {
    return NextResponse.json({ error: "This is not a library file from scripts/fathers/to_bundle.py." }, { status: 400 })
  }
  const works = body.works as Partial<ImportWork>[]
  const bad = works.find(w => !validWork(w))
  if (bad) return NextResponse.json({ error: `Work "${bad?.slug ?? "?"}" in the file is incomplete.` }, { status: 400 })

  const report: string[] = []
  for (const w of works as ImportWork[]) {
    // Text first: the index never points at chapters whose text is missing.
    await writeWorkText(w.slug, { sections: w.sections.map(s => ({ position: s.position, paragraphs: s.paragraphs })) })

    const words = w.sections.reduce((n, s) => n + s.words, 0)
    const meta = {
      collection: w.collection, title: w.title, titleAm: w.titleAm, short: w.short, shortAm: w.shortAm,
      author: w.author, authorAm: w.authorAm, description: w.description, descriptionAm: w.descriptionAm,
      source: w.source, position: w.position, words,
    }
    const work = await prisma.cfWork.upsert({ where: { slug: w.slug }, create: { slug: w.slug, ...meta }, update: meta, select: { id: true } })

    const existing = new Map(
      (await prisma.cfSection.findMany({ where: { workId: work.id }, select: { position: true, title: true, words: true } }))
        .map(s => [s.position, s]),
    )
    const missing = w.sections.filter(s => !existing.has(s.position))
    if (missing.length) {
      await prisma.cfSection.createMany({ data: missing.map(s => ({ workId: work.id, position: s.position, title: s.title, words: s.words })) })
    }
    const changed = w.sections.filter(s => {
      const e = existing.get(s.position)
      return e && (e.title !== s.title || e.words !== s.words)
    })
    for (const s of changed) {
      await prisma.cfSection.update({ where: { workId_position: { workId: work.id, position: s.position } }, data: { title: s.title, words: s.words } })
    }
    report.push(`${w.short}: ${w.sections.length} chapters${missing.length ? `, ${missing.length} new` : ""}`)
  }

  let linked = 0
  for (const b of (Array.isArray(body.books) ? body.books : []) as ImportBook[]) {
    if (!Number.isInteger(b.id) || typeof b.match !== "string" || typeof b.work !== "string") continue
    const target = await prisma.cfWork.findUnique({ where: { slug: b.work }, select: { id: true } })
    if (!target) continue
    // Only the book with this id whose title matches, and only if not linked yet.
    const r = await prisma.cbBook.updateMany({
      where: { id: b.id, cfWorkId: null, name: { contains: b.match, mode: "insensitive" } },
      data: { cfWorkId: target.id, cfFromSection: b.range?.from ?? null, cfToSection: b.range?.to ?? null },
    })
    linked += r.count
  }

  return NextResponse.json({ works: report, linked })
}
