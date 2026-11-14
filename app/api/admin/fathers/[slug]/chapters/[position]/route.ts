import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cleanAmharic, cleanTitle, fathersAdmin } from "@/lib/fathers-admin"
import { updateWorkAmharic } from "@/lib/library"

// Edit a chapter's Amharic, approve it, or take it back for review.
// Body: { titleAm?: string, bodyAm?: string, approved?: boolean }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string; position: string }> }) {
  if (!(await fathersAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { slug, position: raw } = await params
  const position = Number(raw)
  const exists = await prisma.cfSection.findFirst({ where: { work: { slug }, position }, select: { id: true } })
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const text = body.bodyAm !== undefined ? cleanAmharic(body.bodyAm) : undefined
  if (text === null) return NextResponse.json({ error: "The Amharic text is empty or not Amharic." }, { status: 400 })

  let error: string | null = null
  await updateWorkAmharic(slug, chapters => {
    const current = chapters.get(position)
    const paragraphs = text ? text.split("\n\n") : current?.paragraphs
    // Approving needs a translation: sent now, or already saved.
    if (!paragraphs) { error = "Nothing to approve: this chapter has no translation yet."; return }
    chapters.set(position, {
      position,
      title: body.titleAm !== undefined ? cleanTitle(body.titleAm) : current?.title ?? null,
      paragraphs,
      approved: typeof body.approved === "boolean" ? body.approved : current?.approved ?? false,
    })
  })
  return error ? NextResponse.json({ error }, { status: 400 }) : NextResponse.json({ ok: true })
}
