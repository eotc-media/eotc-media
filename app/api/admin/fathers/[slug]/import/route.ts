import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cleanAmharic, cleanTitle, fathersAdmin } from "@/lib/fathers-admin"
import { updateWorkAmharic } from "@/lib/library"

// Load a translation file made by scripts/fathers/translate.mjs into the work's
// Amharic file in R2. Chapters an admin has already approved are left alone;
// everything imported waits for review.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await fathersAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { slug } = await params
  const body = await req.json().catch(() => null)
  if (!body || body.slug !== slug || !Array.isArray(body.sections)) {
    return NextResponse.json({ error: `This is not a translation file for "${slug}".` }, { status: 400 })
  }
  const work = await prisma.cfWork.findUnique({
    where: { slug },
    select: { sections: { select: { position: true } } },
  })
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const positions = new Set(work.sections.map(s => s.position))

  let imported = 0
  let skipped = 0
  await updateWorkAmharic(slug, chapters => {
    for (const s of body.sections as { position?: unknown; titleAm?: unknown; bodyAm?: unknown }[]) {
      const text = cleanAmharic(s.bodyAm)
      const position = s.position as number
      if (!Number.isInteger(position) || !positions.has(position) || !text || chapters.get(position)?.approved) { skipped++; continue }
      chapters.set(position, { position, title: cleanTitle(s.titleAm), paragraphs: text.split("\n\n"), approved: false })
      imported++
    }
  })
  return NextResponse.json({ imported, skipped })
}
