import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  addDays, generatePlan, generateWorkPlan, isWorkConfig, isWorkReading, parseDate, planTitle, PRESETS,
  type AnyPlanConfig, type AnyReading, type BookMeta, type ChapterRow, type PresetKey, type Reading,
  type WorkMeta, type WorkPlanConfig, type WorkReading,
} from "@/lib/reading-plan"

// ── Bible structure ───────────────────────────────────────────────────────────

/** Every book and every chapter's verse count. The Bible does not change, so
 *  this is cached for a day and shared by every plan built in that time. */
export const getBibleStructure = unstable_cache(
  async (): Promise<{ books: BookMeta[]; chapters: ChapterRow[] }> => {
    const [books, rows] = await Promise.all([
      prisma.blBook.findMany({
        select: { id: true, osisCode: true, englishName: true, amharicName: true },
        orderBy: { id: "asc" },
      }),
      prisma.$queryRaw<{ book_id: number; chapter: number; verses: number }[]>`
        SELECT book_id, chapter, COUNT(*)::int AS verses
        FROM bl_verses
        GROUP BY book_id, chapter
        ORDER BY book_id, chapter
      `,
    ])
    // A book with no verses cannot be read on the site, so it is not offered.
    const withText = new Set(rows.map(r => r.book_id))
    return {
      books: books
        .filter(b => withText.has(b.id))
        .map(b => ({ id: b.id, osis: b.osisCode, englishName: b.englishName, amharicName: b.amharicName })),
      chapters: rows.map(r => [r.book_id, r.chapter, r.verses] as ChapterRow),
    }
  },
  ["reading-plan-bible-structure"],
  { revalidate: 86400 },
)

// ── Church Fathers library ────────────────────────────────────────────────────

/** The shelf: every work with its chapters' word counts, in suggested order.
 *  Changes only when a migration adds works, so it is cached for a day. */
export const getWorkShelf = unstable_cache(
  async (): Promise<WorkMeta[]> => {
    const works = await prisma.cfWork.findMany({
      orderBy: { position: "asc" },
      include: { sections: { select: { position: true, words: true }, orderBy: { position: "asc" } } },
    })
    return works.map(w => ({
      id: w.id, slug: w.slug, title: w.title, titleAm: w.titleAm, short: w.short, shortAm: w.shortAm,
      author: w.author, authorAm: w.authorAm, description: w.description, descriptionAm: w.descriptionAm,
      words: w.words, sections: w.sections.map(s => [s.position, s.words] as [number, number]),
    }))
  },
  ["reading-plan-work-shelf"],
  { revalidate: 86400 },
)

const bibleIds = (readings: AnyReading[]) => readings.filter((r): r is Reading => !isWorkReading(r)).map(r => r.bookId)

// ── The reader's own date ─────────────────────────────────────────────────────

/** Today where the reader is. The server runs in UTC, which for a reader in
 *  the Americas rolls over mid-evening — exactly when many people read — so
 *  the page records the browser's time zone and the date is taken there. */
export function localToday(timeZone?: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/** The hour where the reader is, for "good morning" versus "good evening". */
export function localHour(timeZone?: string | null): number {
  try {
    const h = new Intl.DateTimeFormat("en-GB", { timeZone: timeZone || "UTC", hour: "2-digit", hourCycle: "h23" }).format(new Date())
    return Number(h) % 24
  } catch {
    return new Date().getUTCHours()
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const dbDate = (d: string) => parseDate(d)
const isoOf = (d: Date) => d.toISOString().slice(0, 10)

// ── Validation ────────────────────────────────────────────────────────────────

const PRESET_KEYS = new Set<PresetKey>([...Object.keys(PRESETS), "custom"] as PresetKey[])
// About three years. Bounds the rows one request can create.
const MAX_SPAN_DAYS = 1100

function parseDates(r: Record<string, unknown>): { startDate: string; endDate: string; restWeekdays: number[] } | string {
  const startDate = typeof r.startDate === "string" && ISO_DATE.test(r.startDate) ? r.startDate : null
  const endDate = typeof r.endDate === "string" && ISO_DATE.test(r.endDate) ? r.endDate : null
  if (!startDate || !endDate) return "Invalid dates."
  const span = (parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86_400_000
  if (span < 0) return "The plan must end after it starts."
  if (span > MAX_SPAN_DAYS) return "A plan can be at most three years long."

  const rest = Array.isArray(r.restWeekdays)
    ? [...new Set(r.restWeekdays.filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))]
    : []
  if (rest.length >= 7) return "Leave at least one reading day in the week."
  return { startDate, endDate, restWeekdays: rest.sort() }
}

/** A Bible plan, or a plan through one work of the Fathers (`work` set). */
export function parseConfig(raw: unknown, books: BookMeta[], works: WorkMeta[]): AnyPlanConfig | string {
  if (!raw || typeof raw !== "object") return "Invalid plan."
  const r = raw as Record<string, unknown>

  if (r.work !== undefined) {
    const slug = (r.work as { slug?: unknown } | null)?.slug
    const work = works.find(w => w.slug === slug)
    if (!work) return "Unknown book."
    const dates = parseDates(r)
    if (typeof dates === "string") return dates
    // Titles come from the library, never from what the browser sent.
    return { work: { slug: work.slug, title: work.title, titleAm: work.titleAm }, ...dates }
  }

  const preset = r.preset as PresetKey
  if (!PRESET_KEYS.has(preset)) return "Unknown plan type."

  const known = new Set(books.map(b => b.osis))
  const bookList = Array.isArray(r.books) ? r.books.filter((b): b is string => typeof b === "string" && known.has(b)) : []
  if (preset === "custom" && bookList.length === 0) return "Choose at least one book."

  const dates = parseDates(r)
  if (typeof dates === "string") return dates

  return {
    preset,
    books: preset === "custom" ? bookList.slice(0, 100) : [],
    sideBySide: r.sideBySide === true,
    withPsalms: r.withPsalms === true,
    ...dates,
  }
}

// ── Creating ──────────────────────────────────────────────────────────────────

/** Plans a reader can run side by side. Each is a card on the homepage. */
export const MAX_ACTIVE_PLANS = 5

/** Generate and save a plan, next to any the reader already has running. */
export async function createPlan(userId: number, config: AnyPlanConfig) {
  const running = await prisma.readingPlan.count({ where: { userId, status: { in: ["active", "completed"] } } })
  if (running >= MAX_ACTIVE_PLANS) {
    throw new Error(`You can follow up to ${MAX_ACTIVE_PLANS} plans at a time. Stop one to start another.`)
  }
  const { days, summary } = await generateFor(config)
  if (days.length === 0) throw new Error("This selection has nothing to read.")

  return prisma.$transaction(async tx => {
    const plan = await tx.readingPlan.create({
      data: {
        userId,
        title: planTitle(config, summary.readingDays, "en"),
        source: isWorkConfig(config) ? "fathers" : "bible",
        config: config as object,
        startDate: dbDate(days[0].date),
        endDate: dbDate(days[days.length - 1].date),
        totalDays: days.length,
      },
    })
    await tx.readingPlanDay.createMany({
      data: days.map(d => ({
        planId: plan.id,
        dayNumber: d.dayNumber,
        date: dbDate(d.date),
        readings: d.readings as object[],
      })),
    })
    return plan
  })
}

async function generateFor(config: AnyPlanConfig) {
  if (isWorkConfig(config)) {
    const work = (await getWorkShelf()).find(w => w.slug === config.work.slug)
    if (!work) throw new Error("Unknown book.")
    return generateWorkPlan(config as WorkPlanConfig, work)
  }
  const { books, chapters } = await getBibleStructure()
  return generatePlan(config, books, chapters)
}

// ── Reading ───────────────────────────────────────────────────────────────────

export interface PlanDayView {
  dayNumber: number
  date: string
  readings: AnyReading[]
  completed: boolean
}

export interface ActivePlanView {
  id: number
  config: AnyPlanConfig
  startDate: string
  endDate: string
  totalDays: number
  completedDays: number
  streak: number
  behind: number
  today: string
  /** Days from six weeks back to six weeks ahead: enough for today, what is
   *  coming up, recent history and the month on the calendar. */
  window: PlanDayView[]
  bookNames: Record<number, { osis: string; englishName: string; amharicName: string | null }>
}

/** Every plan the reader is following (or has just finished), oldest first. */
export async function getActivePlans(userId: number, today: string): Promise<ActivePlanView[]> {
  const plans = await prisma.readingPlan.findMany({
    where: { userId, status: { in: ["active", "completed"] } },
    orderBy: { createdAt: "asc" },
  })
  return Promise.all(plans.map(plan => planView(plan, today)))
}

async function planView(
  plan: { id: number; config: unknown; startDate: Date; endDate: Date; totalDays: number },
  today: string,
): Promise<ActivePlanView> {
  const [completedDays, behind, past, window] = await Promise.all([
    prisma.readingPlanDay.count({ where: { planId: plan.id, completedAt: { not: null } } }),
    prisma.readingPlanDay.count({ where: { planId: plan.id, completedAt: null, date: { lt: dbDate(today) } } }),
    // Just the two small columns a streak needs, newest first.
    prisma.readingPlanDay.findMany({
      where: { planId: plan.id, date: { lte: dbDate(today) } },
      select: { date: true, completedAt: true },
      orderBy: { date: "desc" },
    }),
    prisma.readingPlanDay.findMany({
      where: { planId: plan.id, date: { gte: dbDate(addDays(today, -42)), lte: dbDate(addDays(today, 42)) } },
      select: { dayNumber: true, date: true, readings: true, completedAt: true },
      orderBy: { dayNumber: "asc" },
    }),
  ])

  // Consecutive reading days completed, counting back from the most recent.
  // Today not yet read does not break it — the day is not over.
  let streak = 0
  for (const [i, d] of past.entries()) {
    if (d.completedAt) streak++
    else if (i === 0 && isoOf(d.date) === today) continue
    else break
  }

  const views: PlanDayView[] = window.map(d => ({
    dayNumber: d.dayNumber,
    date: isoOf(d.date),
    readings: d.readings as unknown as AnyReading[],
    completed: d.completedAt !== null,
  }))

  const ids = [...new Set(views.flatMap(v => bibleIds(v.readings)))]
  const names = ids.length
    ? await prisma.blBook.findMany({
        where: { id: { in: ids } },
        select: { id: true, osisCode: true, englishName: true, amharicName: true },
      })
    : []

  return {
    id: plan.id,
    config: plan.config as unknown as AnyPlanConfig,
    startDate: isoOf(plan.startDate),
    endDate: isoOf(plan.endDate),
    totalDays: plan.totalDays,
    completedDays,
    streak,
    behind,
    today,
    window: views,
    bookNames: Object.fromEntries(names.map(n => [n.id, { osis: n.osisCode, englishName: n.englishName, amharicName: n.amharicName }])),
  }
}

// ── Changing ──────────────────────────────────────────────────────────────────

async function ownPlan(userId: number, planId: number) {
  return prisma.readingPlan.findFirst({ where: { id: planId, userId } })
}

export async function setDayCompleted(userId: number, planId: number, dayNumber: number, done: boolean) {
  const plan = await ownPlan(userId, planId)
  if (!plan) return false
  await prisma.readingPlanDay.update({
    where: { planId_dayNumber: { planId, dayNumber } },
    data: { completedAt: done ? new Date() : null },
  })
  // A plan with every day read is finished; unticking a day reopens it.
  const remaining = await prisma.readingPlanDay.count({ where: { planId, completedAt: null } })
  const status = remaining === 0 ? "completed" : "active"
  if (status !== plan.status) await prisma.readingPlan.update({ where: { id: planId }, data: { status } })
  return true
}

/**
 * Move every unread day forward so the earliest becomes today, keeping their
 * order and the plan's rest days. Days already read keep their dates. For a
 * reader who fell behind, this is a fresh start rather than a wall of overdue
 * days.
 */
export async function catchUp(userId: number, planId: number, today: string) {
  const plan = await ownPlan(userId, planId)
  if (!plan) return false
  const config = plan.config as unknown as AnyPlanConfig
  const rest = new Set(config.restWeekdays ?? [])

  const unread = await prisma.readingPlanDay.findMany({
    where: { planId, completedAt: null },
    select: { id: true },
    orderBy: { dayNumber: "asc" },
  })
  if (unread.length === 0) return true

  const dates: string[] = []
  for (let d = today; dates.length < unread.length; d = addDays(d, 1)) {
    if (!rest.has(parseDate(d).getUTCDay())) dates.push(d)
  }

  // One statement for every row, not one round trip per unread day.
  const ids = unread.map(u => u.id)
  await prisma.$transaction([
    prisma.$executeRaw`
      UPDATE reading_plan_days AS d SET date = v.date
      FROM unnest(${ids}::int[], ${dates}::date[]) AS v(id, date)
      WHERE d.id = v.id
    `,
    prisma.readingPlan.update({ where: { id: planId }, data: { endDate: dbDate(dates[dates.length - 1]) } }),
  ])
  return true
}

/** Stop a plan. Nothing is deleted: its days and notes stay, and it can be resumed. */
export async function archivePlan(userId: number, planId: number) {
  const plan = await ownPlan(userId, planId)
  if (!plan) return false
  await prisma.readingPlan.update({ where: { id: planId }, data: { status: "archived" } })
  return true
}

export interface StoppedPlanView { id: number; config: AnyPlanConfig; totalDays: number; completedDays: number; stoppedAt: string }

/** Plans the reader stopped (or set aside by starting another, before plans
 *  could run side by side), most recent first. */
export async function getStoppedPlans(userId: number): Promise<StoppedPlanView[]> {
  const plans = await prisma.readingPlan.findMany({
    where: { userId, status: "archived" },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, config: true, totalDays: true, updatedAt: true, _count: { select: { days: { where: { completedAt: { not: null } } } } } },
  })
  return plans.map(p => ({
    id: p.id,
    config: p.config as unknown as AnyPlanConfig,
    totalDays: p.totalDays,
    completedDays: p._count.days,
    stoppedAt: isoOf(p.updatedAt),
  }))
}

/** Bring a stopped plan back where it was. If it is behind, the card offers
 *  "Pick up today" as for any plan. */
export async function resumePlan(userId: number, planId: number): Promise<true | string> {
  const plan = await ownPlan(userId, planId)
  if (!plan || plan.status !== "archived") return "Not found."
  const running = await prisma.readingPlan.count({ where: { userId, status: { in: ["active", "completed"] } } })
  if (running >= MAX_ACTIVE_PLANS) return `You can follow up to ${MAX_ACTIVE_PLANS} plans at a time. Stop one to resume this.`
  const unread = await prisma.readingPlanDay.count({ where: { planId, completedAt: null } })
  await prisma.readingPlan.update({ where: { id: planId }, data: { status: unread === 0 ? "completed" : "active" } })
  return true
}

/** Every day of a plan, for the full schedule. */
export async function getPlanSchedule(userId: number, planId: number) {
  const plan = await ownPlan(userId, planId)
  if (!plan) return null
  const days = await prisma.readingPlanDay.findMany({
    where: { planId },
    select: { dayNumber: true, date: true, readings: true, completedAt: true },
    orderBy: { dayNumber: "asc" },
  })
  const ids = [...new Set(days.flatMap(d => bibleIds(d.readings as unknown as AnyReading[])))]
  const names = await prisma.blBook.findMany({
    where: { id: { in: ids } },
    select: { id: true, osisCode: true, englishName: true, amharicName: true },
  })
  return {
    plan: { id: plan.id, config: plan.config as unknown as AnyPlanConfig, totalDays: plan.totalDays, status: plan.status },
    days: days.map(d => ({
      dayNumber: d.dayNumber,
      date: isoOf(d.date),
      readings: d.readings as unknown as AnyReading[],
      completed: d.completedAt !== null,
    })),
    bookNames: Object.fromEntries(names.map(n => [n.id, { osis: n.osisCode, englishName: n.englishName, amharicName: n.amharicName }])),
  }
}

/** The plan a page is about: the one asked for if it is the reader's and
 *  running, otherwise their most recently started running plan. */
export async function currentPlanId(userId: number, requested?: number): Promise<number | null> {
  const running = { userId, status: { in: ["active", "completed"] } }
  if (requested) {
    const own = await prisma.readingPlan.findFirst({ where: { ...running, id: requested }, select: { id: true } })
    if (own) return own.id
  }
  const plan = await prisma.readingPlan.findFirst({ where: running, orderBy: { createdAt: "desc" }, select: { id: true } })
  return plan?.id ?? null
}

export interface PassageVerse { chapter: number; verse: number; am: string; en: string }
export interface WorkPassageSection { position: number; title: string; paragraphs: string[] }
export type DayPassage =
  | { kind: "bible"; reading: Reading; verses: PassageVerse[] }
  | { kind: "work"; reading: WorkReading; title: string; titleAm: string | null; author: string; authorAm: string | null; sections: WorkPassageSection[] }
export interface PlanDayPage {
  planId: number
  title: { config: AnyPlanConfig; totalDays: number }
  dayNumber: number
  date: string
  completed: boolean
  note: string
  hasPrev: boolean
  hasNext: boolean
  passages: DayPassage[]
  bookNames: Record<number, { osis: string; englishName: string; amharicName: string | null }>
}

/**
 * One day of a plan with the text of its passages, in Amharic (1954) and
 * English (KJV), so the page can follow the reader's language without a
 * round trip when they switch it.
 */
export async function getPlanDay(userId: number, planId: number, dayNumber: number): Promise<PlanDayPage | null> {
  const plan = await ownPlan(userId, planId)
  if (!plan) return null
  const day = await prisma.readingPlanDay.findUnique({ where: { planId_dayNumber: { planId, dayNumber } } })
  if (!day) return null

  const readings = day.readings as unknown as AnyReading[]
  const translations = await prisma.blTranslation.findMany({
    where: { code: { in: ["am-1954", "en-kjv"] } },
    select: { id: true, code: true },
  })
  const amId = translations.find(t => t.code === "am-1954")?.id
  const enId = translations.find(t => t.code === "en-kjv")?.id

  const passages = await Promise.all(readings.map(async (reading): Promise<DayPassage> => {
    if (isWorkReading(reading)) {
      const work = await prisma.cfWork.findUnique({
        where: { id: reading.workId },
        select: {
          title: true, titleAm: true, author: true, authorAm: true,
          sections: {
            where: { position: { gte: reading.fromSection, lte: reading.toSection } },
            orderBy: { position: "asc" },
            select: { position: true, title: true, body: true },
          },
        },
      })
      return {
        kind: "work", reading,
        title: work?.title ?? reading.short, titleAm: work?.titleAm ?? null,
        author: work?.author ?? "", authorAm: work?.authorAm ?? null,
        sections: (work?.sections ?? []).map(s => ({ position: s.position, title: s.title, paragraphs: s.body.split("\n\n") })),
      }
    }
    const { bookId, startChapter: sc, endChapter: ec } = reading
    // A reading without verse bounds covers whole chapters.
    const fromVerse = reading.startVerse ? [{ OR: [{ chapter: { gt: sc } }, { verse: { gte: reading.startVerse } }] }] : []
    const toVerse = reading.endVerse ? [{ OR: [{ chapter: { lt: ec } }, { verse: { lte: reading.endVerse } }] }] : []
    const rows = await prisma.blVerse.findMany({
      where: { bookId, chapter: { gte: sc, lte: ec }, AND: [...fromVerse, ...toVerse] },
      orderBy: [{ chapter: "asc" }, { verse: "asc" }],
      select: { chapter: true, verse: true, texts: { select: { translationId: true, text: true } } },
    })
    return {
      kind: "bible",
      reading,
      verses: rows.map(v => ({
        chapter: v.chapter,
        verse: v.verse,
        am: v.texts.find(t => t.translationId === amId)?.text ?? "",
        en: v.texts.find(t => t.translationId === enId)?.text ?? "",
      })),
    }
  }))

  const names = await prisma.blBook.findMany({
    where: { id: { in: bibleIds(readings) } },
    select: { id: true, osisCode: true, englishName: true, amharicName: true },
  })

  return {
    planId,
    title: { config: plan.config as unknown as AnyPlanConfig, totalDays: plan.totalDays },
    dayNumber,
    date: isoOf(day.date),
    completed: day.completedAt !== null,
    note: day.note ?? "",
    hasPrev: dayNumber > 1,
    hasNext: dayNumber < plan.totalDays,
    passages,
    bookNames: Object.fromEntries(names.map(n => [n.id, { osis: n.osisCode, englishName: n.englishName, amharicName: n.amharicName }])),
  }
}

export const NOTE_MAX = 5000

export async function setDayNote(userId: number, planId: number, dayNumber: number, note: string) {
  const plan = await ownPlan(userId, planId)
  if (!plan) return false
  const text = note.slice(0, NOTE_MAX).trim()
  await prisma.readingPlanDay.update({
    where: { planId_dayNumber: { planId, dayNumber } },
    data: { note: text || null },
  })
  return true
}
