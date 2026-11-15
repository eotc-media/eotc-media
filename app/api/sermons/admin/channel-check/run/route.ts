import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { hasSermonAdminAccess } from "@/lib/auth-helpers"
import { runChannelCheck } from "@/lib/sermon-watch"

export const maxDuration = 300

// Run the daily channel check now.
export async function POST() {
  const session = await auth()
  if (!hasSermonAdminAccess(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return NextResponse.json(await runChannelCheck())
}
