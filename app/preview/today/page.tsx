import type { Metadata } from "next"
import Navbar from "@/components/Navbar"
import TodayCard from "@/components/today/TodayCard"
import { addDays, todayUTC } from "@/lib/ethiopian-calendar"
import { getTodayInfo } from "@/lib/today"
import { REVIEWED } from "@/lib/ethiopian-feasts"

// Preview of the Today page. It lives under /preview and is kept out of search
// results until the feast data in lib/ethiopian-feasts.ts has been reviewed;
// moving it to /today afterwards is a rename and a metadata change.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Today — preview",
  robots: { index: false, follow: false },
}

// A reviewer needs to see days other than the one they happen to open this on,
// so ?date=YYYY-MM-DD jumps to any date. Invalid input falls back to today
// rather than erroring.
function resolveDate(raw?: string): Date {
  if (!raw) return todayUTC()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (!m) return todayUTC()
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return isNaN(d.getTime()) ? todayUTC() : d
}

export default async function TodayPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: raw } = await searchParams
  const date = resolveDate(raw)
  const info = getTodayInfo(date)

  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const nav = (offset: number) => `/preview/today?date=${iso(addDays(date, offset))}`

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <TodayCard
          isoDate={iso(info.gregorian)}
          ethiopian={info.ethiopian}
          weekday={info.gregorian.getUTCDay()}
          feasts={info.feasts}
          fasts={info.fasts}
          upcoming={
            info.upcoming
              ? { feast: info.upcoming.feast, isoDate: iso(info.upcoming.date), inDays: info.upcoming.inDays }
              : null
          }
          reviewed={REVIEWED}
        />

        {/* Review aid — goes away when this becomes the real /today page. */}
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-16 text-sm">
          <a href={nav(-1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100">
            ← previous day
          </a>
          <a href="/preview/today" className="text-slate-500 hover:text-slate-800">today</a>
          <a href={nav(1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100">
            next day →
          </a>
        </div>
      </main>
    </>
  )
}
