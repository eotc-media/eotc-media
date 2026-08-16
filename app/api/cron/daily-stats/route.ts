import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Runs once a day (see vercel.json). Vercel Cron sends the secret as
// `Authorization: Bearer $CRON_SECRET`; the ?token= form is kept so the job can
// also be triggered by hand for testing.
//
// The path is public knowledge — vercel.json lives in a public repo — and the
// endpoint gets probed roughly once a minute by automated traffic. Every one of
// those is rejected below before any database work happens, and answered with
// 404 rather than 401 so the endpoint reads as nonexistent rather than as a
// guarded thing worth retrying.

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 })

async function run(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    // Misconfiguration, not an intruder — say so in the logs, since otherwise a
    // silently non-running job looks identical to a working one.
    console.error("[cron/daily-stats] CRON_SECRET is not set; refusing to run.")
    return notFound()
  }

  const authHeader = req.headers.get("authorization") ?? ""
  const tokenParam = new URL(req.url).searchParams.get("token") ?? ""
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : tokenParam

  if (provided !== expected) return notFound()

  // Today (UTC date, time stripped)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // 1. Compute current cumulative totals + the most recent PRIOR recorded stat.
  //    Using the latest prior row (not strictly "yesterday") means a gap or the
  //    first run can't dump the whole cumulative total onto one day.
  const [hymnAgg, sermonAgg, priorStat] = await Promise.all([
    prisma.hmHymn.aggregate({ _sum: { clicksCount: true } }),
    prisma.smSermon.aggregate({ _sum: { clicksCount: true } }),
    prisma.dailyStat.findFirst({ where: { date: { lt: today } }, orderBy: { date: "desc" } }),
  ])

  const hymnTotalClicks   = Number((hymnAgg   as { _sum: { clicksCount: bigint | null } })._sum.clicksCount   ?? 0)
  const sermonTotalClicks = Number((sermonAgg  as { _sum: { clicksCount: bigint | null } })._sum.clicksCount  ?? 0)

  // 2. Daily delta vs. the last recorded totals (0 when there is no prior row).
  //    The dashboard spreads this across any skipped days when charting.
  const hymnDailyClicks   = priorStat ? Math.max(0, hymnTotalClicks   - priorStat.hymnTotalClicks)   : 0
  const sermonDailyClicks = priorStat ? Math.max(0, sermonTotalClicks - priorStat.sermonTotalClicks) : 0

  // 3. Upsert today's row
  await prisma.dailyStat.upsert({
    where:  { date: today },
    update: { hymnTotalClicks, hymnDailyClicks, sermonTotalClicks, sermonDailyClicks },
    create: { date: today,     hymnTotalClicks, hymnDailyClicks, sermonTotalClicks, sermonDailyClicks },
  })

  // One line per successful run, so "did it run?" is answerable from the logs
  // without reading the table.
  const date = today.toISOString().split("T")[0]
  console.log(
    `[cron/daily-stats] ok ${date} hymns=${hymnTotalClicks} (+${hymnDailyClicks}) sermons=${sermonTotalClicks} (+${sermonDailyClicks})`
  )

  return NextResponse.json({
    ok: true,
    date,
    hymnTotalClicks,
    hymnDailyClicks,
    sermonTotalClicks,
    sermonDailyClicks,
  })
}
