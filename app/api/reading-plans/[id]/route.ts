import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { archivePlan } from "@/lib/reading-plan-server"

// Stop a plan. It is archived rather than deleted, so a reader's history of
// what they have read is kept.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const ok = await archivePlan(parseInt(session.user.id), Number(id))
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 })
}
