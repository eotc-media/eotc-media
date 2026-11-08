import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

interface Body {
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  timeZone?: string
  locale?: string
  endpoint?: string
}

function validTimeZone(tz: unknown): string {
  if (typeof tz !== "string") return "UTC"
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return tz } catch { return "UTC" }
}

/** Turn reminders on for this browser. Re-subscribing updates its clock and language. */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = parseInt(session.user.id)

  const body = (await req.json().catch(() => ({}))) as Body
  const endpoint = body.subscription?.endpoint
  const p256dh = body.subscription?.keys?.p256dh
  const authKey = body.subscription?.keys?.auth
  if (!endpoint?.startsWith("https://") || !p256dh || !authKey) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }
  const data = {
    userId,
    p256dh,
    auth: authKey,
    timeZone: validTimeZone(body.timeZone),
    locale: body.locale === "en" ? "en" : "am",
  }
  await prisma.pushSubscription.upsert({ where: { endpoint }, create: { endpoint, ...data }, update: data })
  return NextResponse.json({ ok: true })
}

/** Turn reminders off for this browser. */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { endpoint } = (await req.json().catch(() => ({}))) as Body
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: parseInt(session.user.id) } })
  }
  return NextResponse.json({ ok: true })
}
