"use client"

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

/** "Wed, 4 Nov" in either language, from a YYYY-MM-DD date. */
export function shortDate(iso: string, am: boolean): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(am ? "am-ET" : "en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  })
}

export function longDate(iso: string, am: boolean): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(am ? "am-ET" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  })
}
