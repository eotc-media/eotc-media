"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale } from "@/lib/i18n/LocaleContext"
import {
  ETHIOPIAN_MONTHS_AM, ETHIOPIAN_MONTHS_EN, WEEKDAYS_AM, WEEKDAYS_EN,
  ethiopianMonthLength, ethiopianToGregorian, gregorianToEthiopian, sameDay,
  type EthiopianDate,
} from "@/lib/ethiopian-calendar"

interface Cell {
  ethiopian: EthiopianDate
  gregorian: Date
  inMonth: boolean
}

/** The 6×7 grid for one Ge'ez month, padded with the neighbouring months. */
function buildGrid(year: number, month: number): Cell[] {
  const firstGregorian = ethiopianToGregorian({ year, month, day: 1 })
  const leadingBlanks = firstGregorian.getUTCDay()
  const cells: Cell[] = []

  for (let i = 0; i < 42; i++) {
    const offset = i - leadingBlanks
    const g = new Date(firstGregorian.getTime() + offset * 86_400_000)
    const e = gregorianToEthiopian(g)
    cells.push({ ethiopian: e, gregorian: g, inMonth: e.year === year && e.month === month })
  }
  return cells
}

export default function EthiopianCalendar({ todayIso }: { todayIso: string }) {
  const { locale } = useLocale()
  const am = locale === "am"

  const today = useMemo(() => new Date(todayIso), [todayIso])
  const todayEt = useMemo(() => gregorianToEthiopian(today), [today])

  const [view, setView] = useState({ year: todayEt.year, month: todayEt.month })
  const [selected, setSelected] = useState<Date>(today)

  const grid = useMemo(() => buildGrid(view.year, view.month), [view])
  const selectedEt = gregorianToEthiopian(selected)

  const monthNames = am ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN
  const weekdays = am ? WEEKDAYS_AM : WEEKDAYS_EN

  function step(by: number) {
    setView(({ year, month }) => {
      const next = month + by
      if (next < 1) return { year: year - 1, month: 13 }
      if (next > 13) return { year: year + 1, month: 1 }
      return { year, month: next }
    })
  }

  const gregorianLabel = (d: Date) =>
    d.toLocaleDateString(am ? "am-ET" : "en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    })

  // The Gregorian months a Ge'ez month straddles — a Ge'ez month never lines up
  // with one, so naming both keeps the reader oriented.
  const straddles = useMemo(() => {
    const inMonth = grid.filter((c) => c.inMonth)
    const fmt = (d: Date) =>
      d.toLocaleDateString(am ? "am-ET" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
    const first = fmt(inMonth[0].gregorian)
    const last = fmt(inMonth[inMonth.length - 1].gregorian)
    return first === last ? first : `${first} – ${last}`
  }, [grid, am])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-10 sm:pt-10 sm:pb-14">
      {/* ── Month header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            {monthNames[view.month - 1]}{" "}
            <span className="text-slate-400 font-normal">{view.year}</span>
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 truncate">{straddles}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => step(-1)}
            aria-label={am ? "ያለፈው ወር" : "Previous month"}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setView({ year: todayEt.year, month: todayEt.month }); setSelected(today) }}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
          >
            {am ? "ዛሬ" : "Today"}
          </button>
          <button
            onClick={() => step(1)}
            aria-label={am ? "ቀጣዩ ወር" : "Next month"}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {weekdays.map((w) => (
            <div
              key={w}
              className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400"
            >
              <span className="hidden sm:inline">{w}</span>
              <span className="sm:hidden">{w.slice(0, am ? 1 : 3)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((cell, i) => {
            const isToday = sameDay(cell.gregorian, today)
            const isSelected = sameDay(cell.gregorian, selected)
            const isPagumen = cell.ethiopian.month === 13

            return (
              <button
                key={i}
                onClick={() => {
                  setSelected(cell.gregorian)
                  if (!cell.inMonth) setView({ year: cell.ethiopian.year, month: cell.ethiopian.month })
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 h-16 sm:h-20 border-b border-slate-100 cursor-pointer transition-colors ${
                  i % 7 === 6 ? "" : "border-r"
                } ${
                  !cell.inMonth
                    ? "text-slate-300 hover:bg-slate-50"
                    : isSelected
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-[15px] leading-none tabular-nums ${
                    isToday
                      ? "bg-blue-600 text-white font-semibold"
                      : cell.inMonth
                        ? isSelected
                          ? "text-blue-700 font-semibold"
                          : "text-slate-800"
                        : "text-slate-300"
                  }`}
                >
                  {cell.ethiopian.day}
                </span>
                <span
                  className={`text-[10px] leading-none tabular-nums ${
                    cell.inMonth ? "text-slate-400" : "text-slate-300"
                  }`}
                >
                  {cell.gregorian.getUTCDate()}
                </span>
                {isPagumen && cell.inMonth && (
                  <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-slate-300" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Selected day ─────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {sameDay(selected, today) ? (am ? "ዛሬ" : "Today") : am ? "የተመረጠው ቀን" : "Selected day"}
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {selectedEt.day} {monthNames[selectedEt.month - 1]} {selectedEt.year}
          {am && <span className="text-base font-normal text-slate-400"> ዓ.ም.</span>}
        </p>
        <p className="mt-1 text-sm text-slate-500">{gregorianLabel(selected)}</p>
        <p className="mt-3 text-sm text-slate-400">
          {am ? "የዕለቱ ስንክሳርና ምንባባት በቅርቡ ይታከላሉ።" : "The day's synaxarium and readings are not added yet."}
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        {ethiopianMonthLength(view.year, view.month)} {am ? "ቀናት" : "days"} · {monthNames[view.month - 1]}
      </p>
    </div>
  )
}
