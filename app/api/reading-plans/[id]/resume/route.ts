import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { resumePlan } from "@/lib/reading-plan-server"

// Bring a stopped plan back.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const result = await resumePlan(parseInt(session.user.id), Number(id))
  return result === true ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result }, { status: 400 })
}
