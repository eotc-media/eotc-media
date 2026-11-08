import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { setDayNote } from "@/lib/reading-plan-server"

// Save the reader's note on a day. An empty note clears it.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; day: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, day } = await params
  const body = await req.json().catch(() => ({}))
  if (typeof body?.note !== "string") return NextResponse.json({ error: "Invalid note" }, { status: 400 })
  const ok = await setDayNote(parseInt(session.user.id), Number(id), Number(day), body.note)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}
