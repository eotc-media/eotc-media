import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NOTE_MAX } from "@/lib/reading-plan-server"

// A member's private note on one chapter of a book read online. Empty removes it.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ sectionId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = parseInt(session.user.id)
  const sectionId = Number((await params).sectionId)
  const body = await req.json().catch(() => ({}))
  if (typeof body?.note !== "string") return NextResponse.json({ error: "Invalid note" }, { status: 400 })
  if (!(await prisma.cfSection.findUnique({ where: { id: sectionId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const note = body.note.slice(0, NOTE_MAX).trim()
  if (!note) {
    await prisma.cfSectionNote.deleteMany({ where: { userId, sectionId } })
  } else {
    await prisma.cfSectionNote.upsert({
      where: { userId_sectionId: { userId, sectionId } },
      create: { userId, sectionId, note },
      update: { note },
    })
  }
  return NextResponse.json({ ok: true })
}
