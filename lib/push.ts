import webpush from "web-push"
import { prisma } from "@/lib/prisma"
import { bookLabel, formatReading, parseDate, type Reading } from "@/lib/reading-plan"
import { localToday } from "@/lib/reading-plan-server"

// Evening reminders for reading plans. An hourly job (see
// .github/workflows/plan-reminders.yml) calls sendPlanReminders(); each
// subscription is reminded once, at REMIND_HOUR on its own clock, and only on a
// day that has a reading still unread.

export const REMIND_HOUR = 22 // two hours before the day ends

let configured = false
function configure(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:no-reply@eotcmedia.com", publicKey, privateKey)
  configured = true
  return true
}

export async function sendPlanReminders(now = new Date()): Promise<{ checked: number; sent: number; removed: number; error?: string }> {
  if (!configure()) return { checked: 0, sent: 0, removed: 0, error: "VAPID keys are not configured" }

  const subs = await prisma.pushSubscription.findMany()
  // Only the subscriptions whose clock reads REMIND_HOUR now, and that have not
  // been reminded on their local today.
  const due = subs.filter(s => {
    const today = localToday(s.timeZone)
    const last = s.lastRemindedOn?.toISOString().slice(0, 10)
    return localHourAt(s.timeZone, now) === REMIND_HOUR && last !== today
  })

  let sent = 0
  let removed = 0
  for (const sub of due) {
    const today = localToday(sub.timeZone)
    const day = await prisma.readingPlanDay.findFirst({
      where: { date: parseDate(today), completedAt: null, plan: { userId: sub.userId, status: "active" } },
      select: { readings: true },
    })
    if (!day) continue // read already, a day off, or no plan

    const readings = day.readings as unknown as Reading[]
    const am = sub.locale === "am"
    const payload = JSON.stringify({
      title: am ? "የዛሬው ንባብ ይጠብቅዎታል" : "Today's reading is waiting",
      body: `${await readingSummary(readings, am)}${am ? " · ቀኑ ከማለቁ በፊት ያንብቡ።" : " · There's still time today."}`,
      url: "/",
      tag: "plan-reminder",
    })

    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 60 * 60 })
      await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastRemindedOn: parseDate(today) } })
      sent++
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        // The browser dropped the subscription (app removed, permission revoked).
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
        removed++
      } else {
        console.error("[push] reminder failed:", status, err instanceof Error ? err.message : err)
      }
    }
  }
  return { checked: due.length, sent, removed }
}

function localHourAt(timeZone: string, at: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(at))
}

async function readingSummary(readings: Reading[], am: boolean): Promise<string> {
  const books = await prisma.blBook.findMany({
    where: { id: { in: readings.map(r => r.bookId) } },
    select: { id: true, osisCode: true, englishName: true, amharicName: true },
  })
  const byId = new Map(books.map(b => [b.id, { osis: b.osisCode, englishName: b.englishName, amharicName: b.amharicName }]))
  return readings
    .map(r => {
      const b = byId.get(r.bookId)
      return b ? formatReading(r, bookLabel(b, am ? "am" : "en", r)) : ""
    })
    .filter(Boolean)
    .join(", ")
}
