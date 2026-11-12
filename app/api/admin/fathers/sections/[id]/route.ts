import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { cleanAmharic, cleanTitle, fathersAdmin } from "@/lib/fathers-admin"

// Edit a chapter's Amharic, approve it, or take it back for review.
// Body: { titleAm?: string, bodyAm?: string, approved?: boolean }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await fathersAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const data: { titleAm?: string | null; bodyAm?: string; bodyAmApproved?: boolean } = {}
  if (body.titleAm !== undefined) data.titleAm = cleanTitle(body.titleAm)
  if (body.bodyAm !== undefined) {
    const text = cleanAmharic(body.bodyAm)
    if (!text) return NextResponse.json({ error: "The Amharic text is empty or not Amharic." }, { status: 400 })
    data.bodyAm = text
  }
  if (typeof body.approved === "boolean") data.bodyAmApproved = body.approved
  const r = await prisma.cfSection.updateMany({
    // Approving needs a translation: sent now, or already saved.
    where: { id: Number(id), ...(data.bodyAmApproved && !data.bodyAm ? { bodyAm: { not: null } } : {}) },
    data,
  })
  return r.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}
