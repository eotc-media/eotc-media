"use client"

import { useSyncExternalStore } from "react"
import { useLocale } from "@/lib/i18n/LocaleContext"
import { bookLabel, formatReading, type Reading } from "@/lib/reading-plan"

export type BookNames = Record<number, { osis: string; englishName: string; amharicName: string | null }>

/** `tr("አማርኛ", "English")` — the homepage keeps both spellings side by side,
 *  the way the calendar and liturgy components do. */
export function useTr() {
  const { locale } = useLocale()
  const am = locale === "am"
  return { am, tr: (amText: string, enText: string) => (am ? amText : enText) }
}

/** Opens the reader at the start of a reading, in the reader's language. */
export function readingHref(r: Reading, am: boolean): string {
  const base = am ? "/bible/amharic/1954" : "/bible/english/kjv"
  return `${base}/${r.bookId}/${r.startChapter}${r.startVerse ? `?verse=${r.startVerse}` : ""}`
}

export function readingText(r: Reading, names: BookNames, am: boolean): string {
  const book = names[r.bookId]
  if (!book) return `${r.startChapter}`
  return formatReading(r, bookLabel(book, am ? "am" : "en", r))
}

export const WEEKDAY_SHORT_AM = ["እሑ", "ሰኞ", "ማክ", "ረቡ", "ሐሙ", "ዓር", "ቅዳ"] as const
export const WEEKDAY_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

// Gregorian dates are always written in English, Latin script, whatever the
// interface language: that is how the Gregorian calendar is read here.

/** "Wed, 4 Nov" from a YYYY-MM-DD date. */
export function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  })
}

export function longDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  })
}

const noSubscribe = () => () => {}
function clientNow(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}|${d.getHours()}`
}

/** The reader's own date and hour once the page is running in their browser;
 *  the server's guess until then. The homepage can be served from Cloudflare's
 *  cache to signed-out visitors, so the server's answer may be hours old. */
export function useLocalNow(server: { today: string; hour: number }): { today: string; hour: number } {
  const snap = useSyncExternalStore(noSubscribe, clientNow, () => null)
  if (!snap) return server
  const [today, hour] = snap.split("|")
  return { today, hour: Number(hour) }
}
