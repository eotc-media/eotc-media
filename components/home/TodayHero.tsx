"use client"

import Image from "next/image"
import { ETHIOPIAN_MONTHS_AM, ETHIOPIAN_MONTHS_EN, gregorianToEthiopian } from "@/lib/ethiopian-calendar"
import { useTr, longDate } from "./shared"

// The greeting follows the reader's own clock: the server works out their hour
// from the time zone the page recorded, so it is right at first paint rather
// than corrected after it.
function greeting(hour: number, am: boolean): string {
  if (hour < 12) return am ? "እንደምን አደሩ" : "Good morning"
  if (hour < 18) return am ? "እንደምን ዋሉ" : "Good afternoon"
  return am ? "እንደምን አመሹ" : "Good evening"
}

export default function TodayHero({
  today, hour, firstName,
}: {
  today: string
  hour: number
  firstName?: string | null
}) {
  const { am, tr } = useTr()
  const et = gregorianToEthiopian(new Date(today + "T00:00:00Z"))
  const month = am ? ETHIOPIAN_MONTHS_AM[et.month - 1] : ETHIOPIAN_MONTHS_EN[et.month - 1]

  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/ui/header.jpg"
        alt=""
        fill
        priority
        unoptimized
        className="-z-20 object-cover object-[center_35%]"
      />
      {/* Warm, deep wash: dark enough for white type everywhere on the image,
          tinted toward the painting's own umber rather than neutral black. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1c120b]/75 via-[#24170e]/70 to-[#120c08]/90" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-slate-50 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-24 sm:px-6 sm:pb-36 sm:pt-28 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
          {tr("ዛሬ", "Today")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          {greeting(hour, am)}
          {firstName ? <span className="text-white/70">{am ? "፣ " : ", "}{firstName}</span> : null}
        </h1>

        <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-xl font-medium text-white sm:text-2xl">
            {am ? `${month} ${et.day}፣ ${et.year} ዓ.ም.` : `${et.day} ${month} ${et.year} E.C.`}
          </p>
          <p className="text-sm text-white/65 sm:text-base">{longDate(today)}</p>
        </div>
      </div>
    </section>
  )
}
