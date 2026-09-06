// Ethiopian (Ge'ez) calendar arithmetic.
//
// Everything here is deterministic — no data source, no lookup table, no
// network. The two things it computes are the Ge'ez date for a given day, and
// ትንሣኤ (Fasika), from which every movable feast and fast follows at a fixed
// offset.
//
// Nothing in this file names a feast or a saint. Those live in
// lib/ethiopian-feasts.ts, which is meant to be reviewed and corrected by
// someone who knows the tradition; this file only does the arithmetic.

export interface EthiopianDate {
  year: number
  /** 1–13. Month 13 is ጳጉሜን, which has 5 days (6 before an Ethiopian leap year). */
  month: number
  day: number
}

/** Ge'ez month names, index 0 = መስከረም. */
export const ETHIOPIAN_MONTHS_AM = [
  "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜን",
] as const

export const ETHIOPIAN_MONTHS_EN = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miyazya", "Ginbot", "Sene", "Hamle", "Nehase", "Pagumen",
] as const

export const WEEKDAYS_AM = ["እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ"] as const
export const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const

// Julian Day Number of 1 መስከረም 1 (Amete Mihret).
const ETHIOPIC_EPOCH = 1723856

function floorDiv(a: number, b: number): number {
  return Math.floor(a / b)
}

function gregorianToJDN(year: number, month: number, day: number): number {
  const a = floorDiv(14 - month, 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return (
    day + floorDiv(153 * m + 2, 5) + 365 * y +
    floorDiv(y, 4) - floorDiv(y, 100) + floorDiv(y, 400) - 32045
  )
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044
  const b = floorDiv(4 * a + 3, 146097)
  const c = a - floorDiv(146097 * b, 4)
  const d = floorDiv(4 * c + 3, 1461)
  const e = c - floorDiv(1461 * d, 4)
  const m = floorDiv(5 * e + 2, 153)
  return {
    day: e - floorDiv(153 * m + 2, 5) + 1,
    month: m + 3 - 12 * floorDiv(m, 10),
    year: 100 * b + d - 4800 + floorDiv(m, 10),
  }
}

/** Days since the Unix epoch, in UTC — the app treats a day as a whole day. */
function toUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

export function gregorianToEthiopian(date: Date): EthiopianDate {
  const jdn = gregorianToJDN(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
  const r = ((jdn - ETHIOPIC_EPOCH) % 1461 + 1461) % 1461
  const n = (r % 365) + 365 * floorDiv(r, 1460)
  return {
    year: 4 * floorDiv(jdn - ETHIOPIC_EPOCH, 1461) + floorDiv(r, 365) - floorDiv(r, 1460),
    month: floorDiv(n, 30) + 1,
    day: (n % 30) + 1,
  }
}

export function ethiopianToGregorian(e: EthiopianDate): Date {
  const jdn = ETHIOPIC_EPOCH + 365 + 365 * (e.year - 1) + floorDiv(e.year, 4) + 30 * e.month + e.day - 31
  const g = jdnToGregorian(jdn)
  return toUTCDate(g.year, g.month, g.day)
}

/** ጳጉሜን has 6 days in the year preceding an Ethiopian leap year. */
export function isEthiopianLeapYear(year: number): boolean {
  return year % 4 === 3
}

export function ethiopianMonthLength(year: number, month: number): number {
  if (month < 13) return 30
  return isEthiopianLeapYear(year) ? 6 : 5
}

/**
 * ትንሣኤ (Fasika) for a Gregorian year.
 *
 * The Ethiopian church keeps the same Paschal reckoning as the other Oriental
 * and Eastern Orthodox churches, so this is the Julian computus (Meeus), then
 * shifted onto the Gregorian calendar. Verified against 2022–2026 in the tests
 * at the bottom of this file's PR.
 */
export function fasikaFor(gregorianYear: number): Date {
  const a = gregorianYear % 4
  const b = gregorianYear % 7
  const c = gregorianYear % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = floorDiv(d + e + 114, 31) // 3 = March, 4 = April (Julian)
  const day = ((d + e + 114) % 31) + 1

  // Julian → Gregorian. The gap is 13 days for every year this app will see.
  const julianJDN = gregorianToJDN(gregorianYear, month, day)
  const g = jdnToGregorian(julianJDN + 13)
  return toUTCDate(g.year, g.month, g.day)
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime())
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}

/**
 * The Fasika that governs a given date's movable feasts.
 *
 * ጾመ ነነዌ falls up to 69 days before Fasika, so early-year dates belong to that
 * year's cycle, but a date in, say, November is already looking ahead to next
 * year's Fast of Nineveh. Both are returned so callers can place a date in
 * whichever cycle it actually falls in.
 */
export function paschalCycleFor(date: Date): { thisYear: Date; nextYear: Date } {
  return {
    thisYear: fasikaFor(date.getUTCFullYear()),
    nextYear: fasikaFor(date.getUTCFullYear() + 1),
  }
}

/** Today in UTC, with the time of day discarded. */
export function todayUTC(): Date {
  const now = new Date()
  return toUTCDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate())
}
