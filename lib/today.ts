import {
  addDays, daysBetween, ethiopianToGregorian, gregorianToEthiopian, fasikaFor,
  sameDay, type EthiopianDate,
} from "@/lib/ethiopian-calendar"
import {
  FIXED_FASTS, FIXED_FEASTS, MONTHLY_COMMEMORATIONS, MOVABLE_FASTS, MOVABLE_FEASTS,
  WEEKLY_FAST, type FastSeason, type Named,
} from "@/lib/ethiopian-feasts"

export interface DayFeast extends Named {
  major: boolean
  kind: "monthly" | "fixed" | "movable"
}

export interface TodayInfo {
  gregorian: Date
  ethiopian: EthiopianDate
  /** The ትንሣኤ governing this date's movable feasts. */
  fasika: Date
  feasts: DayFeast[]
  fasts: FastSeason[]
  /** The next major feast after today, for a "coming up" line. */
  upcoming: { feast: DayFeast; date: Date; inDays: number } | null
}

/**
 * ጾመ ነነዌ falls up to 69 days before ትንሣኤ, so a date in January belongs to the
 * cycle of the Fasika still ahead of it, while a date in June belongs to the one
 * behind. Pick whichever this date actually sits within.
 */
function governingFasika(date: Date): Date {
  const thisYear = fasikaFor(date.getUTCFullYear())
  if (daysBetween(thisYear, date) < -69) return fasikaFor(date.getUTCFullYear() - 1)
  if (daysBetween(thisYear, date) > 300) return fasikaFor(date.getUTCFullYear() + 1)
  return thisYear
}

function movableFeastsOn(date: Date, fasika: Date): DayFeast[] {
  const offset = daysBetween(fasika, date)
  return MOVABLE_FEASTS
    .filter(f => f.offset === offset)
    .map(f => ({ am: f.am, en: f.en, major: !!f.major, kind: "movable" as const }))
}

function fixedFeastsOn(et: EthiopianDate): DayFeast[] {
  return FIXED_FEASTS
    .filter(f => f.month === et.month && f.day === et.day)
    .map(f => ({ am: f.am, en: f.en, major: !!f.major, kind: "fixed" as const }))
}

function monthlyOn(et: EthiopianDate): DayFeast[] {
  return (MONTHLY_COMMEMORATIONS[et.day] ?? [])
    .map(f => ({ am: f.am, en: f.en, major: false, kind: "monthly" as const }))
}

/** Ge'ez date as a single comparable number, so a season window is one test. */
function ordinal(month: number, day: number): number {
  return month * 100 + day
}

function fastsOn(date: Date, et: EthiopianDate, fasika: Date, hasMajorFeast: boolean): FastSeason[] {
  const found: FastSeason[] = []
  const offset = daysBetween(fasika, date)

  for (const f of MOVABLE_FASTS) {
    if (offset >= f.from && offset <= f.to) found.push(f)
  }

  const today = ordinal(et.month, et.day)
  for (const f of FIXED_FASTS) {
    const from = ordinal(f.fromMonth, f.fromDay)
    const to = ordinal(f.toMonth, f.toDay)
    // A season may run past ጳጉሜን into the next year, so it can wrap.
    const inside = from <= to ? today >= from && today <= to : today >= from || today <= to
    if (inside) found.push(f)
  }

  // Wednesdays and Fridays, except during the fifty days from ትንሣኤ to ጰራቅሊጦስ,
  // when the church does not fast at all, and except when a major feast such as
  // ገና or ጥምቀት falls on one. (REVIEW: the precise rule for which feasts lift
  // the weekly fast is one of the things worth checking in this file.)
  const weekday = date.getUTCDay()
  const inPaschalSeason = offset >= 0 && offset <= 49
  if ((weekday === 3 || weekday === 5) && !inPaschalSeason && !hasMajorFeast && found.length === 0) {
    found.push(WEEKLY_FAST)
  }

  return found
}

function feastsOn(date: Date): DayFeast[] {
  const et = gregorianToEthiopian(date)
  const fasika = governingFasika(date)
  return [...movableFeastsOn(date, fasika), ...fixedFeastsOn(et), ...monthlyOn(et)]
}

/** The next major feast strictly after `date`, searched a year ahead at most. */
function nextMajorFeast(date: Date): { feast: DayFeast; date: Date; inDays: number } | null {
  for (let i = 1; i <= 366; i++) {
    const d = addDays(date, i)
    const major = feastsOn(d).find(f => f.major)
    if (major) return { feast: major, date: d, inDays: i }
  }
  return null
}

export function getTodayInfo(date: Date): TodayInfo {
  const et = gregorianToEthiopian(date)
  const fasika = governingFasika(date)
  const feasts = feastsOn(date)
  return {
    gregorian: date,
    ethiopian: et,
    fasika,
    feasts,
    fasts: fastsOn(date, et, fasika, feasts.some(f => f.major)),
    upcoming: nextMajorFeast(date),
  }
}

/** Exported for the preview page's year-at-a-glance list. */
export function majorFeastsForEthiopianYear(ethiopianYear: number): Array<{ feast: DayFeast; date: Date }> {
  const start = ethiopianToGregorian({ year: ethiopianYear, month: 1, day: 1 })
  const out: Array<{ feast: DayFeast; date: Date }> = []
  for (let i = 0; i < 366; i++) {
    const d = addDays(start, i)
    if (gregorianToEthiopian(d).year !== ethiopianYear && !sameDay(d, start)) continue
    for (const f of feastsOn(d)) if (f.major) out.push({ feast: f, date: d })
  }
  return out
}
