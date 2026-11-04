import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  addDays, generatePlan, parseDate, planTitle, PRESETS,
  type BookMeta, type ChapterRow, type PlanConfig, type PresetKey, type Reading,
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

export function parseConfig(raw: unknown, books: BookMeta[]): PlanConfig | string {
  if (!raw || typeof raw !== "object") return "Invalid plan."
  const r = raw as Record<string, unknown>

  const preset = r.preset as PresetKey
  if (!PRESET_KEYS.has(preset)) return "Unknown plan type."

  const known = new Set(books.map(b => b.osis))
  const bookList = Array.isArray(r.books) ? r.books.filter((b): b is string => typeof b === "string" && known.has(b)) : []
  if (preset === "custom" && bookList.length === 0) return "Choose at least one book."

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

  return {
    preset,
    books: preset === "custom" ? bookList.slice(0, 100) : [],
    sideBySide: r.sideBySide === true,
    withPsalms: r.withPsalms === true,
    startDate,
    endDate,
    restWeekdays: rest.sort(),
  }
}

// ── Creating ──────────────────────────────────────────────────────────────────

/** Generate and save a plan. Any plan the reader already has running is
 *  archived — one plan at a time, kept in their history. */
export async function createPlan(userId: number, config: PlanConfig) {
  const { books, chapters } = await getBibleStructure()
  const { days, summary } = generatePlan(config, books, chapters)
  if (days.length === 0) throw new Error("This selection has nothing to read.")

  return prisma.$transaction(async tx => {
    await tx.readingPlan.updateMany({ where: { userId, status: "active" }, data: { status: "archived" } })
    const plan = await tx.readingPlan.create({
      data: {
        userId,
        title: planTitle(config, summary.readingDays, "en"),
        source: "bible",
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

// ── Reading ───────────────────────────────────────────────────────────────────

export interface PlanDayView {
  dayNumber: number
  date: string
  readings: Reading[]
  completed: boolean
}

export interface ActivePlanView {
  id: number
  config: PlanConfig
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

export async function getActivePlan(userId: number, today: string): Promise<ActivePlanView | null> {
  const plan = await prisma.readingPlan.findFirst({
    where: { userId, status: { in: ["active", "completed"] } },
    orderBy: { createdAt: "desc" },
  })
  if (!plan) return null

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
    readings: d.readings as unknown as Reading[],
    completed: d.completedAt !== null,
  }))

  const ids = [...new Set(views.flatMap(v => v.readings.map(r => r.bookId)))]
  const names = ids.length
    ? await prisma.blBook.findMany({
        where: { id: { in: ids } },
        select: { id: true, osisCode: true, englishName: true, amharicName: true },
      })
    : []

  return {
    id: plan.id,
    config: plan.config as unknown as PlanConfig,
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
  const config = plan.config as unknown as PlanConfig
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

export async function archivePlan(userId: number, planId: number) {
  const plan = await ownPlan(userId, planId)
  if (!plan) return false
  await prisma.readingPlan.update({ where: { id: planId }, data: { status: "archived" } })
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
  const ids = [...new Set(days.flatMap(d => (d.readings as unknown as Reading[]).map(r => r.bookId)))]
  const names = await prisma.blBook.findMany({
    where: { id: { in: ids } },
    select: { id: true, osisCode: true, englishName: true, amharicName: true },
  })
  return {
    plan: { id: plan.id, config: plan.config as unknown as PlanConfig, totalDays: plan.totalDays, status: plan.status },
    days: days.map(d => ({
      dayNumber: d.dayNumber,
      date: isoOf(d.date),
      readings: d.readings as unknown as Reading[],
      completed: d.completedAt !== null,
    })),
    bookNames: Object.fromEntries(names.map(n => [n.id, { osis: n.osisCode, englishName: n.englishName, amharicName: n.amharicName }])),
  }
}
