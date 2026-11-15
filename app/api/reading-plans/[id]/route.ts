import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { archivePlan, changeRestDays } from "@/lib/reading-plan-server"

// Stop a plan. It is archived rather than deleted, so a reader's history of
// what they have read is kept.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const ok = await archivePlan(parseInt(session.user.id), Number(id))
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}

// Change a plan's days off. { restWeekdays: [0–6], today: "YYYY-MM-DD",
// preview?: true } — with preview, only the new finish date is returned.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const today = typeof body?.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : null
  const rest = Array.isArray(body?.restWeekdays) ? body.restWeekdays : null
  if (!today || !rest || rest.length > 6 || !rest.every((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
  const result = await changeRestDays(parseInt(session.user.id), Number(id), [...new Set(rest as number[])], today, body.preview === true)
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Not found" }, { status: 404 })
}
