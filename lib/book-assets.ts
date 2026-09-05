// Book covers and PDFs live in Cloudflare R2. Serving them through
// /api/books/... meant every byte travelled R2 → Vercel function → Cloudflare →
// reader, and Vercel charged origin transfer for carrying a file that was
// already inside Cloudflare. Pointed at R2's own custom domain the bytes never
// touch Vercel at all, and R2 egress over a custom domain is not billed.
//
// Set NEXT_PUBLIC_R2_PUBLIC_URL to that domain (e.g. https://files.eotcmedia.com).
// Without it these fall back to the API routes, which still work, so nothing
// breaks before the domain exists — or if it is ever taken away.
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "")

function assetUrl(prefix: string, filename: string): string {
  return R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${prefix}/${filename}`
    : `/api/${prefix}/${filename}`
}

/** Public URL for a book cover image. */
export function bookImageUrl(filename: string): string {
  return assetUrl("books/images", filename)
}

/** Public URL for a book's PDF. */
export function bookFileUrl(filename: string): string {
  return assetUrl("books/files", filename)
}
