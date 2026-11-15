import { NextRequest, NextResponse } from "next/server"
import { runChannelCheck } from "@/lib/sermon-watch"

// Once a day (vercel.json): new videos on the sermon channels, checked by
// Gemini; sermons are added as pending for an admin. Same guard as the other
// cron routes: Vercel sends CRON_SECRET as a Bearer token.

export const runtime = "nodejs"
export const maxDuration = 300

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }

async function run(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = req.headers.get("authorization") ?? ""
  if (!expected || auth !== `Bearer ${expected}`) {
    if (!expected) console.error("[cron/sermon-watch] CRON_SECRET is not set; refusing to run.")
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const result = await runChannelCheck()
  if (result.errors.length) console.error("[cron/sermon-watch]", result.errors.slice(0, 10))
  return NextResponse.json(result)
}
