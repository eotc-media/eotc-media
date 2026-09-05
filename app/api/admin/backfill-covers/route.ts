import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { hasMainAdminAccess } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { recompressStoredCover, type RecompressResult } from "@/lib/book-covers"

// Re-encodes covers uploaded before compression existed, run from a browser so
// it uses the R2 and database credentials already on Vercel rather than needing
// them on a laptop. Signed in as an admin, so nothing has to be pasted into the
// address bar; it rewrites storage and book rows, which is not something an
// open URL should let a passing crawler do.
//
//   /api/admin/backfill-covers?dry=1
//   /api/admin/backfill-covers
//
// A function times out long before a few hundred covers are done, so each call
// handles one batch and reports `nextUrl` to continue from. `after` is a book
// id, which keeps the walk stateless — covers left alone because they were
// already small are behind the cursor and never retried.
//
// Delete this route once the backfill has been run; new uploads are compressed
// on the way in, so it has no second use.

export const maxDuration = 60

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasMainAdminAccess(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
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
  const bytesBefore = converted.reduce((n, r) => n + r.before, 0)
  const bytesAfter = converted.reduce((n, r) => n + r.after, 0)

  const done = books.length === 0
  const nextUrl = done
    ? null
    : `${url.origin}${url.pathname}?after=${lastId}&limit=${limit}${dryRun ? "&dry=1" : ""}`

  return NextResponse.json({
    dryRun,
    done,
    batch: {
      scanned: books.length,
      converted: converted.length,
      optimal: results.filter(r => r.status === "optimal").length,
      missing: results.filter(r => r.status === "missing").length,
      failed: results.filter(r => r.status === "failed").length,
      savedKb: +((bytesBefore - bytesAfter) / 1024).toFixed(1),
    },
    remainingAfterThisBatch: Math.max(remaining - books.length, 0),
    results,
    nextUrl,
  })
}
