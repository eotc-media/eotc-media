import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cleanAmharic, cleanTitle, fathersAdmin } from "@/lib/fathers-admin"

// Load a translation file made by scripts/fathers/translate.mjs. Chapters an
// admin has already approved are left alone; everything imported waits for
// review.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await fathersAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { slug } = await params
  const body = await req.json().catch(() => null)
  if (!body || body.slug !== slug || !Array.isArray(body.sections)) {
    return NextResponse.json({ error: `This is not a translation file for "${slug}".` }, { status: 400 })
  }
  const work = await prisma.cfWork.findUnique({ where: { slug }, select: { id: true } })
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let imported = 0
  let skipped = 0
  for (const s of body.sections as { position?: unknown; titleAm?: unknown; bodyAm?: unknown }[]) {
    const text = cleanAmharic(s.bodyAm)
    if (!Number.isInteger(s.position) || !text) { skipped++; continue }
    const r = await prisma.cfSection.updateMany({
      where: { workId: work.id, position: s.position as number, bodyAmApproved: false },
      data: { bodyAm: text, titleAm: cleanTitle(s.titleAm) },
    })
    if (r.count) imported++
    else skipped++
  }
  return NextResponse.json({ imported, skipped })
}
