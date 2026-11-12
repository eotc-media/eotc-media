// Reading-plan engine. Pure: no database, no Next — the plan builder runs it in
// the browser for an instant preview, and the server runs the same code to
// generate the plan it actually saves, so a preview can never disagree with
// what a reader gets.
//
// The unit of reading is a chapter, weighted by its verse count. Chapters run
// from 2 verses (Psalm 117) to 176 (Psalm 119), so dividing a book by chapter
// count gives days that differ tenfold; dividing by verses keeps every day
// about as long as the last.

import { BIBLE_SECTIONS } from "@/lib/bible-sections"

// ── Inputs ────────────────────────────────────────────────────────────────────

/** One chapter as stored: [bookId, chapter, verseCount]. Compact, because the
 *  builder downloads all of them. */
export type ChapterRow = [number, number, number]

export interface BookMeta {
  id: number
  osis: string
  englishName: string
  amharicName: string | null
}

export type PresetKey =
  | "whole-bible"
  | "new-testament"
  | "old-testament"
  | "gospels"
  | "psalms-proverbs"
  | "custom"

export interface PlanConfig {
  preset: PresetKey
  /** OSIS codes, used only when preset is "custom". */
  books: string[]
  /** Read the Old and New Testament as two parallel tracks. */
  sideBySide: boolean
  /** Add the Psalms as their own daily track. */
  withPsalms: boolean
  /** YYYY-MM-DD, inclusive. */
  startDate: string
  endDate: string
  /** 0 = Sunday … 6 = Saturday. No reading is scheduled on these. */
  restWeekdays: number[]
}

/** A plan through one work of the Church Fathers. */
export interface WorkPlanConfig {
  work: { slug: string; title: string; titleAm: string | null }
  startDate: string
  endDate: string
  restWeekdays: number[]
}

export type AnyPlanConfig = PlanConfig | WorkPlanConfig
export const isWorkConfig = (c: AnyPlanConfig): c is WorkPlanConfig => "work" in c

/** A work as the builder needs it: sections as [position, words]. */
export interface WorkMeta {
  id: number
  slug: string
  title: string
  titleAm: string | null
  short: string
  shortAm: string | null
  author: string
  authorAm: string | null
  description: string
  descriptionAm: string | null
  words: number
  sections: [number, number][]
}

// ── Outputs ───────────────────────────────────────────────────────────────────

/** A contiguous passage within one book. Verse bounds are present only when
 *  the passage starts or ends mid-chapter. */
export interface Reading {
  bookId: number
  osis: string
  startChapter: number
  endChapter: number
  startVerse?: number
  endVerse?: number
  /** Verses in this reading, for "about N minutes". */
  verses?: number
}

/** A run of chapters from a work of the Church Fathers (positions are 1-based). */
export interface WorkReading {
  workId: number
  short: string
  shortAm: string | null
  fromSection: number
  toSection: number
  words: number
}

export type AnyReading = Reading | WorkReading
export const isWorkReading = (r: AnyReading): r is WorkReading => "workId" in r

export interface PlanDay {
  dayNumber: number
  date: string
  readings: AnyReading[]
  verses: number
}

export interface PlanSummary {
  readingDays: number
  totalVerses: number
  totalChapters: number
  versesPerDay: number
  minutesPerDay: number
  trackCount: number
}

// ── Presets ───────────────────────────────────────────────────────────────────

const sectionOsis = (...names: string[]) =>
  BIBLE_SECTIONS.filter(s => names.includes(s.name)).flatMap(s => s.osis)

export const NEW_TESTAMENT_OSIS = new Set(
  sectionOsis("Gospels", "Acts", "Pauline Epistles", "General Epistles", "Revelation"),
)

export const isNewTestament = (osis: string) => NEW_TESTAMENT_OSIS.has(osis)

export const PRESETS: Record<
  Exclude<PresetKey, "custom">,
  {
    am: string
    en: string
    descAm: string
    descEn: string
    days: number
    osis: (all: string[]) => string[]
    /** Read these books as parallel tracks rather than one after another. */
    parallel?: string[][]
  }
> = {
  "whole-bible": {
    am: "መጽሐፍ ቅዱስን በሙሉ",
    en: "The whole Bible",
    descAm: "ከኦሪት ዘፍጥረት እስከ ራእይ",
    descEn: "Genesis to Revelation",
    days: 365,
    osis: all => all,
  },
  "new-testament": {
    am: "ሐዲስ ኪዳን",
    en: "New Testament",
    descAm: "ከወንጌላት እስከ ራእይ",
    descEn: "The Gospels to Revelation",
    days: 90,
    osis: all => all.filter(isNewTestament),
  },
  "old-testament": {
    am: "ብሉይ ኪዳን",
    en: "Old Testament",
    descAm: "ሕግ፣ ታሪክ፣ ጥበብና ነቢያት",
    descEn: "Law, history, wisdom and the prophets",
    days: 270,
    osis: all => all.filter(o => !isNewTestament(o)),
  },
  gospels: {
    am: "አራቱ ወንጌላት",
    en: "The four Gospels",
    descAm: "ማቴዎስ፣ ማርቆስ፣ ሉቃስና ዮሐንስ",
    descEn: "Matthew, Mark, Luke and John",
    days: 30,
    osis: all => all.filter(o => ["Matt", "Mark", "Luke", "John"].includes(o)),
  },
  "psalms-proverbs": {
    am: "መዝሙረ ዳዊትና ምሳሌ",
    en: "Psalms & Proverbs",
    descAm: "የጸሎትና የጥበብ መጻሕፍት",
    descEn: "Prayer and wisdom",
    days: 60,
    osis: all => all.filter(o => o === "Ps" || o === "Prov"),
    // Some psalms and some Proverbs each day, rather than all the Psalms and
    // then all of Proverbs.
    parallel: [["Ps"], ["Prov"]],
  },
}

// Average reading pace. About nine verses a minute is a comfortable,
// attentive pace for Scripture — slower than skimming, not a study session.
export const VERSES_PER_MINUTE = 9
/** Unhurried reading of older English prose. */
export const WORDS_PER_MINUTE = 180

// ── Dates ─────────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000

export function parseDate(d: string): Date {
  const [y, m, day] = d.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, day))
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(d: string, n: number): string {
  return formatDate(new Date(parseDate(d).getTime() + n * DAY_MS))
}

/** Every date from start to end inclusive that is not a rest day. */
export function readingDates(startDate: string, endDate: string, restWeekdays: number[]): string[] {
  const rest = new Set(restWeekdays)
  const out: string[] = []
  const end = parseDate(endDate).getTime()
  for (let t = parseDate(startDate).getTime(); t <= end; t += DAY_MS) {
    if (!rest.has(new Date(t).getUTCDay())) out.push(formatDate(new Date(t)))
  }
  return out
}

/** The end date that fits `readingDays` reading days after start, skipping rest days. */
export function endDateFor(startDate: string, readingDays: number, restWeekdays: number[]): string {
  if (restWeekdays.length >= 7) return startDate
  const rest = new Set(restWeekdays)
  let t = parseDate(startDate).getTime()
  let counted = 0
  for (;;) {
    if (!rest.has(new Date(t).getUTCDay())) counted++
    if (counted >= readingDays) return formatDate(new Date(t))
    t += DAY_MS
  }
}

// ── Tracks ────────────────────────────────────────────────────────────────────

/** Book order follows the reader's own order (book id), so a plan reads in
 *  the same sequence as the Bible page's book list. */
function orderedOsis(books: BookMeta[], wanted: Set<string>): string[] {
  return [...books].sort((a, b) => a.id - b.id).filter(b => wanted.has(b.osis)).map(b => b.osis)
}

/**
 * A track is read in parallel with the others, every day of the plan.
 *
 * "psalter" is the daily psalm: one whole psalm a day, starting again from
 * Psalm 1 when the book runs out — the Psalter prayed continually, as the
 * Church prays it — rather than a psalm cut into a few verses.
 */
export interface Track {
  osis: string[]
  kind: "reading" | "psalter"
}

export function resolveTracks(config: PlanConfig, books: BookMeta[]): Track[] {
  const all = [...books].sort((a, b) => a.id - b.id).map(b => b.osis)
  const preset = config.preset === "custom" ? null : PRESETS[config.preset]
  const chosen = preset ? preset.osis(all) : orderedOsis(books, new Set(config.books))

  // A daily psalm only makes sense alongside something else.
  const psalter = config.withPsalms && all.includes("Ps") && chosen.some(o => o !== "Ps")
  const main = psalter ? chosen.filter(o => o !== "Ps") : chosen

  let groups: string[][]
  if (preset?.parallel) {
    groups = preset.parallel.map(g => g.filter(o => main.includes(o)))
  } else if (config.sideBySide) {
    groups = [main.filter(o => !isNewTestament(o)), main.filter(isNewTestament)]
  } else {
    groups = [main]
  }

  const tracks: Track[] = groups.filter(g => g.length).map(osis => ({ osis, kind: "reading" }))
  if (psalter) tracks.push({ osis: ["Ps"], kind: "psalter" })
  return tracks
}

// ── Partitioning ──────────────────────────────────────────────────────────────

interface Unit {
  bookId: number
  osis: string
  chapter: number
  chapterVerses: number
  from: number
  to: number
}

const weight = (u: Unit) => u.to - u.from + 1

function splitUnit(u: Unit, pieces: number): Unit[] {
  const n = weight(u)
  const k = Math.min(pieces, n)
  const out: Unit[] = []
  let start = u.from
  for (let i = 0; i < k; i++) {
    const size = Math.floor(n / k) + (i < n % k ? 1 : 0)
    out.push({ ...u, from: start, to: start + size - 1 })
    start += size
  }
  return out
}

/**
 * Divide units into `days` contiguous groups of roughly equal weight.
 *
 * Chapters stay whole unless a single one would be more than twice a day's
 * share — in a year through the Bible that is only Psalm 119, which most plans
 * also split — or unless the track has fewer chapters than the plan has days,
 * in which case it becomes a few verses a day.
 */
export function partition(units: Unit[], days: number): Unit[][] {
  const total = units.reduce((s, u) => s + weight(u), 0)
  if (days <= 0 || total === 0) return []
  const target = total / days

  // Split into as few pieces as gets each near a day's share — Psalm 119 in a
  // year becomes two halves, not three thirds.
  let work: Unit[] = []
  for (const u of units) {
    work.push(...(weight(u) > 2 * target ? splitUnit(u, Math.ceil(weight(u) / (1.5 * target))) : [u]))
  }

  // Still fewer pieces than days: keep halving the largest until every day
  // can have something.
  while (work.length < days) {
    let idx = -1
    for (let i = 0; i < work.length; i++) if (weight(work[i]) > 1 && (idx < 0 || weight(work[i]) > weight(work[idx]))) idx = i
    if (idx < 0) break
    work = [...work.slice(0, idx), ...splitUnit(work[idx], 2), ...work.slice(idx + 1)]
  }

  return cutByWeight(work.map(weight), days).map(([a, b]) => work.slice(a, b))
}

/**
 * Split a sequence of weights into at most `parts` contiguous runs of roughly
 * equal total, cutting where the running total is nearest each ideal boundary
 * and leaving at least one item for every later run. Returns [start, end)
 * index pairs.
 */
export function cutByWeight(weights: number[], parts: number): [number, number][] {
  const n = weights.length
  const k = Math.min(parts, n)
  if (k <= 0) return []
  const total = weights.reduce((s, w) => s + w, 0)
  const prefix = [0]
  for (const w of weights) prefix.push(prefix[prefix.length - 1] + w)

  const runs: [number, number][] = []
  let prev = 0
  for (let j = 1; j < k; j++) {
    const ideal = (j * total) / k
    const lo = prev + 1
    const hi = n - (k - j)
    let best = lo
    for (let c = lo; c <= hi; c++) {
      if (Math.abs(prefix[c] - ideal) < Math.abs(prefix[best] - ideal)) best = c
      else if (prefix[c] > ideal) break
    }
    runs.push([prev, best])
    prev = best
  }
  runs.push([prev, n])
  return runs
}

/** Collapse a day's units into one reading per book. */
function toReadings(units: Unit[]): Reading[] {
  const runs: Unit[][] = []
  for (const u of units) {
    const run = runs[runs.length - 1]
    if (run && run[0].bookId === u.bookId) run.push(u)
    else runs.push([u])
  }
  return runs.map(run => {
    const first = run[0]
    const last = run[run.length - 1]
    const partial = first.from !== 1 || last.to !== last.chapterVerses
    // When either end is mid-chapter, both bounds are kept: "119:89–176"
    // needs the 176 even though the passage does run to the chapter's end.
    return {
      bookId: first.bookId,
      osis: first.osis,
      startChapter: first.chapter,
      endChapter: last.chapter,
      ...(partial ? { startVerse: first.from, endVerse: last.to } : {}),
      verses: run.reduce((n, u) => n + weight(u), 0),
    }
  })
}

// ── Generation ────────────────────────────────────────────────────────────────

export interface GenerateResult {
  days: PlanDay[]
  summary: PlanSummary
}

/** Place whole units evenly across the days, some days having none. For a
 *  track shorter than the plan that runs beside a longer one: a New Testament
 *  chapter on most days reads better than a few verses of one every day. */
function spread(units: Unit[], days: number): Unit[][] {
  const out: Unit[][] = Array.from({ length: days }, () => [])
  units.forEach((u, i) => out[Math.floor((i * days) / units.length)].push(u))
  return out
}

/** One whole psalm a day, from Psalm 1, starting over when the book ends.
 *  Psalm 119 is taken in parts of about a typical psalm's length. */
function psalter(units: Unit[], days: number): Unit[][] {
  const typical = Math.max(1, Math.round(units.reduce((s, u) => s + weight(u), 0) / units.length))
  const pieces = units.flatMap(u => (weight(u) > 3 * typical ? splitUnit(u, Math.round(weight(u) / typical)) : [u]))
  return Array.from({ length: days }, (_, i) => (pieces.length ? [pieces[i % pieces.length]] : []))
}

export function generatePlan(config: PlanConfig, books: BookMeta[], chapters: ChapterRow[]): GenerateResult {
  const dates = readingDates(config.startDate, config.endDate, config.restWeekdays)
  const tracks = resolveTracks(config, books)
  const osisOf = new Map(books.map(b => [b.id, b.osis]))
  const idOf = new Map(books.map(b => [b.osis, b.id]))

  const byBook = new Map<number, ChapterRow[]>()
  for (const row of chapters) {
    if (!byBook.has(row[0])) byBook.set(row[0], [])
    byBook.get(row[0])!.push(row)
  }

  const unitsOf = (osisList: string[]): Unit[] => {
    const units: Unit[] = []
    for (const osis of osisList) {
      const bookId = idOf.get(osis)
      if (bookId === undefined) continue
      for (const [, chapter, verses] of [...(byBook.get(bookId) ?? [])].sort((a, b) => a[1] - b[1])) {
        units.push({ bookId, osis: osisOf.get(bookId)!, chapter, chapterVerses: verses, from: 1, to: verses })
      }
    }
    return units
  }

  const built = tracks.map(t => ({ track: t, units: unitsOf(t.osis) }))
  // The longest reading track sets the rhythm and is the one guaranteed to
  // have something every day; the others fit around it.
  const primary = built
    .filter(b => b.track.kind === "reading")
    .reduce<(typeof built)[number] | null>(
      (best, b) => (!best || b.units.reduce((s, u) => s + weight(u), 0) > best.units.reduce((s, u) => s + weight(u), 0) ? b : best),
      null,
    )

  const perDay: Unit[][] = dates.map(() => [])
  let totalVerses = 0
  let totalChapters = 0

  for (const b of built) {
    let groups: Unit[][]
    if (b.track.kind === "psalter") groups = psalter(b.units, dates.length)
    else if (b === primary || b.units.length >= dates.length) groups = partition(b.units, dates.length)
    else groups = spread(b.units, dates.length)

    groups.forEach((g, i) => perDay[i].push(...g))
    if (b.track.kind === "reading") {
      totalVerses += b.units.reduce((s, u) => s + weight(u), 0)
      totalChapters += b.units.length
    }
  }

  const days: PlanDay[] = dates.map((date, i) => ({
    dayNumber: i + 1,
    date,
    readings: toReadings(perDay[i]),
    verses: perDay[i].reduce((s, u) => s + weight(u), 0),
  })).filter(d => d.readings.length > 0)

  // Renumber after dropping any empty day, so day numbers stay contiguous.
  days.forEach((d, i) => (d.dayNumber = i + 1))

  // Pace counts what is actually read each day, the daily psalm included.
  const versesPerDay = days.length ? days.reduce((s, d) => s + d.verses, 0) / days.length : 0
  return {
    days,
    summary: {
      readingDays: days.length,
      totalVerses,
      totalChapters,
      versesPerDay: Math.round(versesPerDay),
      minutesPerDay: Math.max(1, Math.round(versesPerDay / VERSES_PER_MINUTE)),
      trackCount: tracks.length,
    },
  }
}

/** About how long a day's readings take. */
export function minutesFor(readings: AnyReading[]): number {
  const minutes = readings.reduce(
    (n, r) => n + (isWorkReading(r) ? r.words / WORDS_PER_MINUTE : (r.verses ?? 0) / VERSES_PER_MINUTE),
    0,
  )
  return Math.max(1, Math.round(minutes))
}

/**
 * A plan through one work: its chapters, kept whole, spread over the reading
 * days so each day is about the same length. A work with fewer chapters than
 * days simply ends early — a chapter is never split.
 */
export function generateWorkPlan(config: WorkPlanConfig, work: WorkMeta): GenerateResult {
  const dates = readingDates(config.startDate, config.endDate, config.restWeekdays)
  const runs = cutByWeight(work.sections.map(([, w]) => w), dates.length)
  const days: PlanDay[] = runs.map(([a, b], i) => {
    const words = work.sections.slice(a, b).reduce((s, [, w]) => s + w, 0)
    return {
      dayNumber: i + 1,
      date: dates[i],
      readings: [{
        workId: work.id, short: work.short, shortAm: work.shortAm,
        fromSection: work.sections[a][0], toSection: work.sections[b - 1][0], words,
      }],
      verses: 0,
    }
  })
  const wordsPerDay = days.length ? work.words / days.length : 0
  return {
    days,
    summary: {
      readingDays: days.length,
      totalVerses: 0,
      totalChapters: work.sections.length,
      versesPerDay: 0,
      minutesPerDay: Math.max(1, Math.round(wordsPerDay / WORDS_PER_MINUTE)),
      trackCount: 1,
    },
  }
}

/** Reading days a work needs at about `minutes` a day (never more than it has chapters). */
export function daysForWorkMinutes(work: WorkMeta, minutes: number): number {
  const days = Math.ceil(work.words / (Math.max(1, minutes) * WORDS_PER_MINUTE))
  return Math.max(1, Math.min(work.sections.length, days))
}

/** Reading days needed to keep to about `minutes` a day. */
export function daysForMinutes(totalVerses: number, minutes: number): number {
  return Math.max(1, Math.ceil(totalVerses / (Math.max(1, minutes) * VERSES_PER_MINUTE)))
}

/** Total verses a config covers, for turning a minutes-a-day pace into days. */
export function versesFor(config: PlanConfig, books: BookMeta[], chapters: ChapterRow[]): number {
  // The daily psalm repeats rather than being "finished", so it does not
  // count toward the length of what is being read through.
  const wanted = new Set(resolveTracks(config, books).filter(t => t.kind === "reading").flatMap(t => t.osis))
  const ids = new Set(books.filter(b => wanted.has(b.osis)).map(b => b.id))
  return chapters.reduce((s, [bookId, , v]) => (ids.has(bookId) ? s + v : s), 0)
}

// ── Display ───────────────────────────────────────────────────────────────────

/** A book's name for a reading. English says "Psalm 23" but "Psalms 1–3". */
export function bookLabel(book: Pick<BookMeta, "osis" | "englishName" | "amharicName">, lang: "am" | "en", r?: Reading): string {
  if (lang === "am") return book.amharicName ?? book.englishName
  if (book.osis === "Ps" && r && r.startChapter === r.endChapter) return "Psalm"
  return book.englishName
}

/** "Genesis 1–3", "Psalm 119:1–88", "Psalm 116:12 – 117:2". */
export function formatReading(r: Reading, bookName: string): string {
  const partial = r.startVerse !== undefined
  if (r.startChapter === r.endChapter) {
    return partial
      ? `${bookName} ${r.startChapter}:${r.startVerse}–${r.endVerse}`
      : `${bookName} ${r.startChapter}`
  }
  return partial
    ? `${bookName} ${r.startChapter}:${r.startVerse} – ${r.endChapter}:${r.endVerse}`
    : `${bookName} ${r.startChapter}–${r.endChapter}`
}

/** "1 Clement 4–9", "ዲዳኬ 3". Positions are the work's own chapter order. */
export function formatWorkReading(r: WorkReading, lang: "am" | "en"): string {
  const name = lang === "am" ? (r.shortAm ?? r.short) : r.short
  return r.fromSection === r.toSection ? `${name} ${r.fromSection}` : `${name} ${r.fromSection}–${r.toSection}`
}

/** Plan title from its config, in either language. */
export function planTitle(config: AnyPlanConfig, readingDays: number, lang: "am" | "en"): string {
  const name = isWorkConfig(config)
    ? lang === "am" ? (config.work.titleAm ?? config.work.title) : config.work.title
    : config.preset === "custom"
      ? lang === "am" ? "የራስዎ ምርጫ" : "Your selection"
      : PRESETS[config.preset][lang]
  const span =
    readingDays >= 360 && readingDays <= 370
      ? lang === "am" ? "በአንድ ዓመት" : "in a year"
      : lang === "am" ? `በ${readingDays} ቀናት` : `in ${readingDays} days`
  return `${name} ${span}`
}
