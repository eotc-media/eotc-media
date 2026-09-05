/**
 * One-off backfill: re-encode already-uploaded book covers.
 *
 * New uploads are compressed on the way in (app/api/books/submit/route.ts), but
 * everything submitted before that went to R2 at full size. This walks the
 * existing covers and applies the same treatment.
 *
 * Needs DATABASE_URL and the R2_* variables locally. Without them, the same
 * work runs on Vercel via /api/admin/backfill-covers, which has them already.
 *
 *   npx tsx --env-file=.env scripts/compress-book-covers.ts --dry-run
 *   npx tsx --env-file=.env scripts/compress-book-covers.ts
 */
import { prisma } from "../lib/prisma"
import { recompressStoredCover } from "../lib/book-covers"

const dryRun = process.argv.includes("--dry-run")

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`

async function main() {
  const books = await prisma.cbBook.findMany({
    where: { image: { not: null } },
    select: { image: true },
    orderBy: { id: "asc" },
  })

  // Two rows can name the same file, and the second pass over it would find the
  // original already deleted. One pass per distinct cover instead.
  const covers = [...new Set(books.map(b => b.image).filter((i): i is string => !!i))]

  console.log(`${books.length} books, ${covers.length} distinct covers${dryRun ? " (dry run)" : ""}\n`)

  const counts = { converted: 0, optimal: 0, missing: 0, failed: 0 }
  let before = 0
  let after = 0

  for (const image of covers) {
    const result = await recompressStoredCover(image, { dryRun })
    counts[result.status]++

    if (result.status === "converted") {
      before += result.before
      after += result.after
      console.log(`  ${image}  ${kb(result.before)} → ${kb(result.after)}`)
    } else if (result.status === "failed") {
      console.error(`  ! ${image} — ${result.error}`)
    } else if (result.status === "missing") {
      console.warn(`  ? ${image} — not in R2, leaving row alone`)
    }
  }

  const saved = before - after
  console.log(
    `\n${counts.converted} converted, ${counts.optimal} already optimal, ` +
    `${counts.missing} missing, ${counts.failed} failed` +
    (counts.converted ? `\n${kb(before)} → ${kb(after)} (saved ${kb(saved)}, ${((saved / before) * 100).toFixed(0)}%)` : "")
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
