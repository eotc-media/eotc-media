import sharp from "sharp"
import { prisma } from "@/lib/prisma"
import { getObject, putObject, deleteObject } from "@/lib/storage"

// Covers are displayed a few hundred pixels wide at most, but people upload
// whatever their phone or scanner produced. One definition of "compressed",
// shared by the upload path and the backfill, so the two can never drift.
export const COVER_MAX_WIDTH = 600
export const COVER_PREFIX = "books/images"

export async function compressCover(input: Uint8Array): Promise<Uint8Array> {
  return sharp(input)
    .rotate() // honour EXIF orientation, which stripping metadata would otherwise discard
    .resize({ width: COVER_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}

export type RecompressResult =
  | { image: string; status: "converted"; newImage: string; before: number; after: number }
  | { image: string; status: "optimal" | "missing" }
  | { image: string; status: "failed"; error: string }

/**
 * Re-encode one already-stored cover and repoint every book row naming it.
 *
 * The result is written under a NEW key ending .webp rather than overwriting in
 * place: files.eotcmedia.com carries a long cache TTL, so an overwrite would
 * keep serving the old bytes for as long as that TTL lasts, while a new
 * filename simply isn't cached yet. The old object is deleted only after the
 * rows are updated, so an interrupted run leaves orphaned files in R2 — never a
 * book pointing at a cover that no longer exists.
 */
export async function recompressStoredCover(
  image: string,
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<RecompressResult> {
  const oldKey = `${COVER_PREFIX}/${image}`

  let stored
  try {
    stored = await getObject(oldKey)
  } catch (err) {
    return { image, status: "failed", error: `read failed: ${(err as Error).message}` }
  }
  if (!stored) return { image, status: "missing" }

  const original = Buffer.from(stored.body)

  let compressed: Uint8Array
  try {
    compressed = await compressCover(original)
  } catch (err) {
    return { image, status: "failed", error: `could not decode: ${(err as Error).message}` }
  }

  // Re-encoding an already-small WebP can come out larger. Leave those alone;
  // churning the filename for no gain only costs cache warmth.
  if (compressed.length >= original.length) return { image, status: "optimal" }

  const newImage = `${image.replace(/\.[^./]+$/, "")}.webp`
  const newKey = `${COVER_PREFIX}/${newImage}`
  const result: RecompressResult = {
    image,
    status: "converted",
    newImage,
    before: original.length,
    after: compressed.length,
  }
  if (dryRun) return result

  await putObject(newKey, compressed, "image/webp")
  // Matched on the filename rather than a list of ids, so two books sharing one
  // cover are both repointed even when they are far apart in the run.
  await prisma.cbBook.updateMany({ where: { image }, data: { image: newImage } })
  if (newKey !== oldKey) await deleteObject(oldKey)

  return result
}
