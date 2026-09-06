"use client"

import { useLocale } from "@/lib/i18n/LocaleContext"
import {
  ETHIOPIAN_MONTHS_AM, ETHIOPIAN_MONTHS_EN, WEEKDAYS_AM, WEEKDAYS_EN,
} from "@/lib/ethiopian-calendar"
import type { DayFeast } from "@/lib/today"
import type { FastSeason } from "@/lib/ethiopian-feasts"

// The server can't know the reader's language — the locale lives in a cookie
// read on the client — so the page hands over both spellings of everything and
// this picks. Dates arrive as ISO strings because a Date does not survive the
// server/client boundary intact.
export interface TodayCardProps {
  isoDate: string
  ethiopian: { year: number; month: number; day: number }
  weekday: number
  feasts: DayFeast[]
  fasts: FastSeason[]
  upcoming: { feast: DayFeast; isoDate: string; inDays: number } | null
  reviewed: boolean
}

export default function TodayCard({
  isoDate, ethiopian, weekday, feasts, fasts, upcoming, reviewed,
}: TodayCardProps) {
  const { locale } = useLocale()
  const am = locale === "am"

  const pick = (v: { am: string; en: string }) => (am ? v.am : v.en)
  const monthName = am
    ? ETHIOPIAN_MONTHS_AM[ethiopian.month - 1]
    : ETHIOPIAN_MONTHS_EN[ethiopian.month - 1]
  const weekdayName = am ? WEEKDAYS_AM[weekday] : WEEKDAYS_EN[weekday]

  const gregorian = new Date(isoDate).toLocaleDateString(am ? "am-ET" : "en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  })

  const major = feasts.filter(f => f.major)
  const rest = feasts.filter(f => !f.major)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      {!reviewed && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="font-semibold">Draft — not yet reviewed.</strong>{" "}
          The calendar arithmetic is verified, but the feast and fast names on this
          page are a draft and have not been checked against a church source.
        </div>
      )}

      {/* ── Date ─────────────────────────────────────────────────────────── */}
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          {weekdayName}
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900 sm:text-5xl">
          {ethiopian.day} {monthName}
        </h1>
        <p className="mt-1 text-lg text-slate-600">{ethiopian.year} ዓ.ም.</p>
        <p className="mt-3 text-sm text-slate-500">{gregorian}</p>
      </div>

      {/* ── Major feast ──────────────────────────────────────────────────── */}
      {major.length > 0 && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 px-5 py-5 text-center">
          {major.map((f, i) => (
            <p key={i} className="text-xl font-semibold text-blue-900">
              {pick(f)}
            </p>
          ))}
        </div>
      )}

      {/* ── Fasting ──────────────────────────────────────────────────────── */}
      {fasts.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {am ? "ጾም" : "Fasting"}
          </p>
          {fasts.map((f, i) => (
            <p key={i} className="mt-1 text-base text-slate-800">{pick(f)}</p>
          ))}
        </div>
      )}

      {/* ── Commemorations ───────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {am ? "የዕለቱ መታሰቢያ" : "Commemorated today"}
          </p>
          <ul className="mt-2 space-y-1.5">
            {rest.map((f, i) => (
              <li key={i} className="text-base text-slate-800">{pick(f)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Coming up ────────────────────────────────────────────────────── */}
      {upcoming && (
        <p className="mt-6 text-center text-sm text-slate-500">
          {am
            ? `${pick(upcoming.feast)} — በ${upcoming.inDays} ቀን`
            : `${pick(upcoming.feast)} — in ${upcoming.inDays} day${upcoming.inDays === 1 ? "" : "s"}`}
        </p>
      )}
    </div>
  )
}
