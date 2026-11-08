"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { ETHIOPIAN_MONTHS_AM, ETHIOPIAN_MONTHS_EN, gregorianToEthiopian } from "@/lib/ethiopian-calendar"
import { planTitle, type PlanConfig, type Reading } from "@/lib/reading-plan"
import { useTr, readingText, shortDate, type BookNames } from "./shared"

interface Day { dayNumber: number; date: string; readings: Reading[]; completed: boolean }

export default function ScheduleList({
  planId, config, totalDays, days, bookNames, today,
}: {
  planId: number
  config: PlanConfig
  totalDays: number
  days: Day[]
  bookNames: BookNames
  today: string
}) {
  const { am, tr } = useTr()
  const router = useRouter()
  const [local, setLocal] = useState<Record<number, boolean>>({})
  const [stopping, setStopping] = useState(false)

  // Grouped by Ge'ez month, which is how the year is lived here.
  const months = useMemo(() => {
    const groups: { key: string; label: string; days: Day[] }[] = []
    for (const d of days) {
      const et = gregorianToEthiopian(new Date(d.date + "T00:00:00Z"))
      const key = `${et.year}-${et.month}`
      const label = `${(am ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN)[et.month - 1]} ${et.year}`
      if (groups[groups.length - 1]?.key !== key) groups.push({ key, label, days: [] })
      groups[groups.length - 1].days.push(d)
    }
    return groups
  }, [days, am])

  async function toggle(d: Day) {
    const next = !(local[d.dayNumber] ?? d.completed)
    setLocal(l => ({ ...l, [d.dayNumber]: next }))
    const res = await fetch(`/api/reading-plans/${planId}/days/${d.dayNumber}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    })
    if (!res.ok) setLocal(l => ({ ...l, [d.dayNumber]: !next }))
  }

  async function stop() {
    if (!confirm(tr("ይህን ዕቅድ ማቆም ይፈልጋሉ? ያነበቡት ታሪክ ይቀመጣል።", "Stop this plan? What you've read stays in your history."))) return
    setStopping(true)
    await fetch(`/api/reading-plans/${planId}`, { method: "DELETE" })
    router.push("/")
    router.refresh()
  }

  const done = days.filter(d => local[d.dayNumber] ?? d.completed).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {tr("ወደ መነሻ ገጽ", "Back to home")}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{planTitle(config, totalDays, am ? "am" : "en")}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {tr(`${done} ከ ${totalDays} ቀናት ተነበዋል`, `${done} of ${totalDays} days read`)}
      </p>

      <div className="mt-8 space-y-8">
        {months.map(m => (
          <section key={m.key}>
            <h2 className="sticky top-16 z-10 -mx-1 bg-slate-50/95 px-1 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
              {m.label}
            </h2>
            <ul className="mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {m.days.map(d => {
                const isDone = local[d.dayNumber] ?? d.completed
                const isToday = d.date === today
                return (
                  <li key={d.dayNumber} className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 ${isToday ? "bg-blue-50/50" : ""}`}>
                    <button
                      onClick={() => toggle(d)}
                      aria-label={isDone ? tr("እንዳልተነበበ ይመዝግቡ", "Mark unread") : tr("እንደተነበበ ይመዝግቡ", "Mark read")}
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors cursor-pointer ${
                        isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </button>
                    <div className="w-24 flex-shrink-0">
                      <p className={`text-xs font-semibold ${isToday ? "text-blue-700" : "text-slate-500"}`}>
                        {isToday ? tr("ዛሬ", "Today") : tr(`ቀን ${d.dayNumber}`, `Day ${d.dayNumber}`)}
                      </p>
                      <p className="text-[11px] text-slate-400">{shortDate(d.date)}</p>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      {d.readings.map((r, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-slate-300"> · </span>}
                          <Link href={`/reading-plan/day/${d.dayNumber}#passage-${i}`} className={`hover:text-blue-700 hover:underline ${isDone ? "text-slate-400" : "text-slate-800"}`}>
                            {readingText(r, bookNames, am)}
                          </Link>
                        </span>
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-slate-200 pt-6">
        <button
          onClick={stop}
          disabled={stopping}
          className="flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
        >
          {stopping && <Loader2 className="h-4 w-4 animate-spin" />}
          {tr("ይህን ዕቅድ ያቁሙ", "Stop this plan")}
        </button>
      </div>
    </div>
  )
}
