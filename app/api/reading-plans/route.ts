import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createPlan, getBibleStructure, getWorkShelf, parseConfig } from "@/lib/reading-plan-server"

// Start a plan. The browser sends only the choices it made; the plan itself is
// generated here, so a saved plan is always what the engine produces and never
// whatever a client chose to send.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to start a plan." }, { status: 401 })

  const body = await req.json().catch(() => null)
  const [{ books }, works] = await Promise.all([getBibleStructure(), getWorkShelf()])
  const config = parseConfig(body?.config, books, works)
  if (typeof config === "string") return NextResponse.json({ error: config }, { status: 400 })

  try {
    const plan = await createPlan(parseInt(session.user.id), config)
    return NextResponse.json({ id: plan.id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
