import { NextRequest, NextResponse } from "next/server"
import { sendPlanReminders } from "@/lib/push"

// Called every hour by .github/workflows/plan-reminders.yml (Vercel's own cron
// runs only daily on this plan). Same guard as the other cron routes: the
// secret as a Bearer token, and a 404 for anything else.

export const runtime = "nodejs"

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }

async function run(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const auth = req.headers.get("authorization") ?? ""
  if (!expected || auth !== `Bearer ${expected}`) {
    if (!expected) console.error("[cron/plan-reminders] CRON_SECRET is not set; refusing to run.")
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const result = await sendPlanReminders()
  if (result.error) console.error("[cron/plan-reminders]", result.error)
  return NextResponse.json(result)
}
