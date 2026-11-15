import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { hasSermonAdminAccess } from "@/lib/auth-helpers"
import { approveSuggestions } from "@/lib/sermon-topics"

// Approve the suggested topics of the given sermons as they are.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!hasSermonAdminAccess(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json().catch(() => null)
  const ids = Array.isArray(body?.sermonIds) ? body.sermonIds.filter((x: unknown) => Number.isInteger(x)) : []
  if (!ids.length) return NextResponse.json({ error: "No sermons" }, { status: 400 })
  return NextResponse.json({ approved: await approveSuggestions(ids) })
}
