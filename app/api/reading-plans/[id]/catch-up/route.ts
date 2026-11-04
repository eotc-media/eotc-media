import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { catchUp } from "@/lib/reading-plan-server"

// Move the unread days forward so the plan resumes today. The browser sends
// its own date: the reader's today, not the server's.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const today = typeof body?.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : null
  if (!today) return NextResponse.json({ error: "Missing date" }, { status: 400 })
  const ok = await catchUp(parseInt(session.user.id), Number(id), today)
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}
