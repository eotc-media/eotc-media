import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { currentPlanId, getPlanDay } from "@/lib/reading-plan-server"
import Navbar from "@/components/Navbar"
import PlanDayReader from "@/components/home/PlanDayReader"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Reading plan — EOTC Media",
  robots: { index: false, follow: false },
}

export default async function PlanDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params
  const session = await auth()
  if (!session?.user?.id) redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/reading-plan/day/${day}`)}`)
  const userId = parseInt(session.user.id)

  const planId = await currentPlanId(userId)
  if (!planId) redirect("/")
  const dayNumber = Number(day)
  if (!Number.isInteger(dayNumber) || dayNumber < 1) notFound()

  const data = await getPlanDay(userId, planId, dayNumber)
  if (!data) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-16">
        <PlanDayReader key={dayNumber} data={data} />
      </main>
    </div>
  )
}
