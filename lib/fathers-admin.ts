import { auth } from "@/auth"
import { hasMainAdminAccess } from "@/lib/auth-helpers"

const ETHIOPIC = /[ሀ-᎟]/g
export const MAX_SECTION_AM = 30_000

/** Main admins only. Returns the session's user id, or null. */
export async function fathersAdmin(): Promise<number | null> {
  const session = await auth()
  return session?.user?.id && hasMainAdminAccess(session) ? parseInt(session.user.id) : null
}

/** A one-line title, or null. */
export function cleanTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const t = raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  return t && t.length <= 300 ? t : null
}

/** Plain text in paragraphs; null if it does not look like an Amharic translation. */
export function cleanAmharic(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const text = raw
    .replace(/<[^>]*>/g, "")
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
  if (!text || text.length > MAX_SECTION_AM) return null
  return (text.match(ETHIOPIC) ?? []).length >= 10 ? text : null
}
