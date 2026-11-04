import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { setDayCompleted } from "@/lib/reading-plan-server"

// Mark a day read, or unread.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; day: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, day } = await params
  const body = await req.json().catch(() => ({}))
  const ok = await setDayCompleted(parseInt(session.user.id), Number(id), Number(day), body?.done !== false)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}
