import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { hasSermonAdminAccess } from "@/lib/auth-helpers"
import { suggestTopicsForNext } from "@/lib/sermon-topics"

export const maxDuration = 60

// Suggest topics for the next batch of sermons that have none. The review page
// calls this repeatedly until nothing remains.
export async function POST() {
  const session = await auth()
  if (!hasSermonAdminAccess(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const result = await suggestTopicsForNext()
  return NextResponse.json(result, { status: result.error ? 502 : 200 })
}
