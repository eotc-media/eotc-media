import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deliverNextBatch } from "@/lib/email-campaign"

// Runs once a day (see vercel.json) and sends the next batch of whichever
// campaigns are still running. Guarded exactly as the daily-stats job is: the
// path is public knowledge, so an unauthorised call is answered with 404 rather
// than 401, before any work happens.

export const maxDuration = 60

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 })

async function run(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    console.error("[cron/email-drip] CRON_SECRET is not set; refusing to run.")
    return notFound()
  }

  const authHeader = req.headers.get("authorization") ?? ""
  const tokenParam = new URL(req.url).searchParams.get("token") ?? ""
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : tokenParam
  if (provided !== expected) return notFound()

  const running = await prisma.emailCampaign.findMany({
    where: { status: "running" },
    orderBy: { id: "asc" },
    select: { id: true },
  })

  const results = []
  for (const { id } of running) {
    const r = await deliverNextBatch(id)
    results.push({ campaignId: id, ...r })
    console.log(
      `[cron/email-drip] campaign ${id}: sent=${r.sent} failed=${r.failed} skipped=${r.skipped} remaining=${r.remaining}` +
      (r.error ? ` error=${r.error}` : "")
    )
  }

  if (running.length === 0) console.log("[cron/email-drip] no running campaigns")

  return NextResponse.json({ ok: true, campaigns: results })
}
