"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  ETHIOPIAN_MONTHS_AM, ETHIOPIAN_MONTHS_EN, buildMonthGrid, gregorianToEthiopian,
} from "@/lib/ethiopian-calendar"
import { useTr, WEEKDAY_SHORT_AM, WEEKDAY_SHORT_EN } from "./shared"

export type DayMark = "done" | "todo" | "missed"

/**
 * The Ge'ez month, with the Gregorian date small beneath each day. When the
 * reader has a plan, its days are marked on it: read, still to come, or missed.
 */
export default function MiniCalendar({ today, marks }: { today: string; marks?: Record<string, DayMark> }) {
  const { am, tr } = useTr()
  const todayEt = useMemo(() => gregorianToEthiopian(new Date(today + "T00:00:00Z")), [today])
  const [view, setView] = useState({ year: todayEt.year, month: todayEt.month })
  const grid = useMemo(() => buildMonthGrid(view.year, view.month), [view])

  const step = (by: number) =>
    setView(({ year, month }) => {
      const m = month + by
      if (m < 1) return { year: year - 1, month: 13 }
      if (m > 13) return { year: year + 1, month: 1 }
      return { year, month: m }
    })

  const names = am ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN
  const weekdays = am ? WEEKDAY_SHORT_AM : WEEKDAY_SHORT_EN
  const inMonth = grid.filter(c => c.inMonth)
  const gregSpan = (() => {
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })
    const a = fmt(inMonth[0].gregorian)
    const b = fmt(inMonth[inMonth.length - 1].gregorian)
    return a === b ? a : `${a} – ${b}`
  })()

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900">
            {names[view.month - 1]} <span className="font-normal text-slate-400">{view.year}</span>
          </p>
          <p className="truncate text-xs text-slate-500">{gregSpan}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => step(-1)}
            aria-label={tr("ያለፈው ወር", "Previous month")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => step(1)}
            aria-label={tr("ቀጣዩ ወር", "Next month")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center">
        {weekdays.map(w => (
          <div key={w} className="pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{w}</div>
        ))}
        {grid.map((cell, i) => {
          const iso = cell.gregorian.toISOString().slice(0, 10)
          const isToday = iso === today
          const mark = marks?.[iso]
          return (
            <div key={i} className="flex flex-col items-center py-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums ${
                  isToday
                    ? "bg-blue-600 font-semibold text-white shadow-sm shadow-blue-600/30"
                    : cell.inMonth ? "text-slate-800" : "text-slate-300"
                }`}
              >
                {cell.ethiopian.day}
              </span>
              <span className={`text-[9px] leading-tight tabular-nums ${cell.inMonth ? "text-slate-400" : "text-slate-300"}`}>
                {cell.gregorian.getUTCDate()}
              </span>
              <span
                className={`mt-0.5 h-1 w-1 rounded-full ${
                  mark === "done" ? "bg-emerald-500" : mark === "missed" ? "bg-rose-400" : mark === "todo" ? "bg-slate-300" : "bg-transparent"
                }`}
              />
            </div>
          )
        })}
      </div>

      {marks && (
        <div className="mt-3 flex items-center justify-center gap-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <Legend color="bg-emerald-500" label={tr("ተነቧል", "Read")} />
          <Legend color="bg-slate-300" label={tr("የሚቀጥል", "Ahead")} />
          <Legend color="bg-rose-400" label={tr("ያመለጠ", "Missed")} />
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} /> {label}
    </span>
  )
}
