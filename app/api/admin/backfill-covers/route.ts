import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { recompressStoredCover, type RecompressResult } from "@/lib/book-covers"

// Re-encodes covers uploaded before compression existed, run from a browser so
// it uses the R2 and database credentials already on Vercel rather than needing
// them on a laptop. Deliberately unguarded: it exists for one five-minute
// window and is deleted straight afterwards, which is the only reason an open
// URL that rewrites storage is acceptable here.
//
//   /api/admin/backfill-covers?dry=1
//   /api/admin/backfill-covers
//
// One call keeps going until it runs out of covers or out of time, then reports
// `nextUrl` to resume from — so this is a couple of clicks, not one per cover.
// `after` is a book id, which keeps the walk stateless: covers left alone
// because they were already small sit behind the cursor and are never retried.
//
// Delete this route once the backfill has been run; new uploads are compressed
// on the way in, so it has no second use.

export const maxDuration = 60

// Stop well short of maxDuration: a cover already being encoded when the budget
// runs out still has to finish, and the response still has to be written.
const BUDGET_MS = 45_000
const PAGE = 10

export async function GET(req: NextRequest) {
  try {
    return await run(req)
  } catch (err) {
    // A bare 500 says nothing, and this route is short-lived enough that
    // returning the real message costs nothing either.
    const error = err as Error
    console.error("[admin/backfill-covers]", error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}

async function run(req: NextRequest) {
  const url = new URL(req.url)
  const dryRun = url.searchParams.get("dry") === "1"
  const after = Number(url.searchParams.get("after") ?? 0) || 0

  const startedAt = Date.now()
  const results: RecompressResult[] = []
  const seen = new Set<string>()
  let cursor = after
  let scanned = 0

  outer: while (Date.now() - startedAt < BUDGET_MS) {
    const books = await prisma.cbBook.findMany({
      where: { image: { not: null }, id: { gt: cursor } },
      select: { id: true, image: true },
      orderBy: { id: "asc" },
      take: PAGE,
    })
    if (books.length === 0) break

    for (const book of books) {
      cursor = book.id
      scanned++
      if (!book.image || seen.has(book.image)) continue
      seen.add(book.image)
      results.push(await recompressStoredCover(book.image, { dryRun }))
      if (Date.now() - startedAt >= BUDGET_MS) break outer
    }
  }

  const remaining = await prisma.cbBook.count({
    where: { image: { not: null }, id: { gt: cursor } },
  })

  const converted = results.filter(r => r.status === "converted")
  const bytesBefore = converted.reduce((n, r) => n + r.before, 0)
  const bytesAfter = converted.reduce((n, r) => n + r.after, 0)

  return NextResponse.json({
    dryRun,
    done: remaining === 0,
    elapsedSeconds: +((Date.now() - startedAt) / 1000).toFixed(1),
    thisRun: {
      scanned,
      converted: converted.length,
      optimal: results.filter(r => r.status === "optimal").length,
      missing: results.filter(r => r.status === "missing").length,
      failed: results.filter(r => r.status === "failed").length,
      savedKb: +((bytesBefore - bytesAfter) / 1024).toFixed(1),
    },
    remaining,
    results,
    nextUrl:
      remaining === 0
        ? null
        : `${url.origin}${url.pathname}?after=${cursor}${dryRun ? "&dry=1" : ""}`,
  })
}
