import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { currentPlanId, getPlanSchedule, localToday } from "@/lib/reading-plan-server"
import Navbar from "@/components/Navbar"
import ScheduleList from "@/components/home/ScheduleList"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Reading plan — EOTC Media",
  robots: { index: false, follow: false },
}

export default async function PlanSchedulePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/reading-plan${plan ? `?plan=${plan}` : ""}`)}`)
  }
  const userId = parseInt(session.user.id)

  const planId = await currentPlanId(userId, Number(plan) || undefined)
  if (!planId) redirect("/")

  const schedule = await getPlanSchedule(userId, planId)
  if (!schedule) redirect("/")

  const today = localToday((await cookies()).get("tz")?.value)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-16">
        <ScheduleList
          planId={schedule.plan.id}
          config={schedule.plan.config}
          totalDays={schedule.plan.totalDays}
          days={schedule.days}
          bookNames={schedule.bookNames}
          today={today}
        />
      </main>
    </div>
  )
}
