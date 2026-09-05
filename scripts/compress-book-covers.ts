/**
 * One-off backfill: re-encode already-uploaded book covers.
 *
 * New uploads are compressed on the way in (app/api/books/submit/route.ts), but
 * everything submitted before that went to R2 at full size. This walks the
 * existing covers and applies the same treatment.
 *
 * Each cover is written under a NEW key ending .webp and the book row is
 * repointed at it, rather than overwriting in place. Overwriting would leave
 * every edge cache and browser serving the old bytes from the long TTL on
 * files.eotcmedia.com; a new filename simply isn't cached yet. The old object
 * is deleted only after the row has been updated, so a crash mid-run leaves
 * orphaned files, never a book with a broken cover.
 *
 *   npx tsx --env-file=.env scripts/compress-book-covers.ts --dry-run
 *   npx tsx --env-file=.env scripts/compress-book-covers.ts
 */
import sharp from "sharp"
import { prisma } from "../lib/prisma"
import { getObject, putObject, deleteObject } from "../lib/storage"

const COVER_MAX_WIDTH = 600
const PREFIX = "books/images"

const dryRun = process.argv.includes("--dry-run")

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`

async function main() {
  const books = await prisma.cbBook.findMany({
    where: { image: { not: null } },
    select: { id: true, image: true },
    orderBy: { id: "asc" },
  })

  // Nothing stops two rows from naming the same file, and deleting it after the
  // first row would break the second. Convert to one pass per distinct cover.
  const byImage = new Map<string, number[]>()
  for (const b of books) {
    if (!b.image) continue
    byImage.set(b.image, [...(byImage.get(b.image) ?? []), b.id])
  }

  console.log(`${books.length} books, ${byImage.size} distinct covers${dryRun ? " (dry run)" : ""}\n`)

  let converted = 0
  let skipped = 0
  let missing = 0
  let failed = 0
  let before = 0
  let after = 0

  for (const [image, bookIds] of byImage) {
    const oldKey = `${PREFIX}/${image}`

    let stored
    try {
      stored = await getObject(oldKey)
    } catch (err) {
      console.error(`  ! ${image} — read failed: ${(err as Error).message}`)
      failed++
      continue
    }

    if (!stored) {
      console.warn(`  ? ${image} — not in R2, leaving row alone`)
      missing++
      continue
    }

    const original = Buffer.from(stored.body)

    let compressed: Buffer
    try {
      compressed = await sharp(original)
        .rotate()
        .resize({ width: COVER_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()
    } catch (err) {
      console.error(`  ! ${image} — could not decode: ${(err as Error).message}`)
      failed++
      continue
    }

    // Re-encoding an already-small WebP can come out larger. Leave those alone;
    // churning the filename for no gain only costs cache warmth.
    if (compressed.length >= original.length) {
      skipped++
      continue
    }

    before += original.length
    after += compressed.length
    converted++

    const base = image.replace(/\.[^./]+$/, "")
    const newImage = `${base}.webp`
    const newKey = `${PREFIX}/${newImage}`

    console.log(`  ${image}  ${kb(original.length)} → ${kb(compressed.length)}`)
    if (dryRun) continue

    await putObject(newKey, compressed, "image/webp")
    await prisma.cbBook.updateMany({ where: { id: { in: bookIds } }, data: { image: newImage } })
    if (newKey !== oldKey) await deleteObject(oldKey)
  }

  const saved = before - after
  console.log(
    `\n${converted} converted, ${skipped} already optimal, ${missing} missing, ${failed} failed` +
    (converted ? `\n${kb(before)} → ${kb(after)} (saved ${kb(saved)}, ${((saved / before) * 100).toFixed(0)}%)` : "")
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
