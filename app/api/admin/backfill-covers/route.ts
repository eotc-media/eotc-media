import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { recompressStoredCover, type RecompressResult } from "@/lib/book-covers"

// Re-encodes covers uploaded before compression existed, run from a browser so
// it uses the R2 and database credentials already on Vercel rather than needing
// them on a laptop. Guarded exactly as the cron routes are: the path is public
// knowledge, so an unauthorised call is answered with 404 before any work.
//
//   /api/admin/backfill-covers?token=<CRON_SECRET>&dry=1
//   /api/admin/backfill-covers?token=<CRON_SECRET>
//
// A function times out long before a few hundred covers are done, so each call
// handles one batch and reports `nextUrl` to continue from. `after` is a book
// id, which keeps the walk stateless — covers left alone because they were
// already small are behind the cursor and never retried.

export const maxDuration = 60

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    console.error("[admin/backfill-covers] CRON_SECRET is not set; refusing to run.")
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const url = new URL(req.url)
  if (url.searchParams.get("token") !== expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const dryRun = url.searchParams.get("dry") === "1"
  const after = Number(url.searchParams.get("after") ?? 0) || 0
  const limit = Math.min(Number(url.searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT)

  const books = await prisma.cbBook.findMany({
    where: { image: { not: null }, id: { gt: after } },
    select: { id: true, image: true },
    orderBy: { id: "asc" },
    take: limit,
  })

  const remaining = await prisma.cbBook.count({
    where: { image: { not: null }, id: { gt: after } },
  })

  const results: RecompressResult[] = []
  const seen = new Set<string>()
  let lastId = after

  for (const book of books) {
    lastId = book.id
    if (!book.image || seen.has(book.image)) continue
    seen.add(book.image)
    results.push(await recompressStoredCover(book.image, { dryRun }))
  }

  const converted = results.filter(r => r.status === "converted")
  const before = converted.reduce((n, r) => n + r.before, 0)
  const after_ = converted.reduce((n, r) => n + r.after, 0)

  const done = books.length === 0
  const nextUrl = done
    ? null
    : `${url.origin}${url.pathname}?token=${expected}&after=${lastId}` +
      `&limit=${limit}${dryRun ? "&dry=1" : ""}`

  return NextResponse.json({
    dryRun,
    done,
    batch: {
      scanned: books.length,
      converted: converted.length,
      optimal: results.filter(r => r.status === "optimal").length,
      missing: results.filter(r => r.status === "missing").length,
      failed: results.filter(r => r.status === "failed").length,
      savedKb: +((before - after_) / 1024).toFixed(1),
    },
    remainingAfterThisBatch: Math.max(remaining - books.length, 0),
    results,
    nextUrl,
  })
}
