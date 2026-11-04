import type { Metadata } from "next"
import { cookies } from "next/headers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getHymns } from "@/lib/api/hymns"
import { getSermons } from "@/lib/api/sermons"
import { getActivePlan, localHour, localToday } from "@/lib/reading-plan-server"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import TodayHero from "@/components/home/TodayHero"
import ReadingPlanSection from "@/components/home/ReadingPlanSection"
import ExploreGrid from "@/components/home/ExploreGrid"
import ListenSection from "@/components/home/ListenSection"
import TimezoneSync from "@/components/home/TimezoneSync"

// The reading-plan page, linked from the homepage; it may replace / later.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Bible Reading Plan — EOTC Media",
  description: "Read the whole Bible in a year, or any books at your own pace, with today's reading, your progress and the Ethiopian calendar in one place.",
  alternates: { canonical: "/today" },
}

/** Admin-featured items first; if none are set, whatever the section leads with. */
async function listenItems(userId?: number) {
  const featured = await prisma.featuredItem.findMany({
    where: { moduleType: { in: ["hymn", "sermon"] } },
    orderBy: { orderBy: "asc" },
  })
  const hymnIds = featured.filter(f => f.moduleType === "hymn").map(f => f.itemId).slice(0, 4)
  const sermonIds = featured.filter(f => f.moduleType === "sermon").map(f => f.itemId).slice(0, 4)

  const [hymns, sermons] = await Promise.all([
    hymnIds.length
      ? getHymns({ itemIds: hymnIds, userId, limit: hymnIds.length })
      : getHymns({ userId, limit: 4 }),
    sermonIds.length
      ? getSermons({ itemIds: sermonIds, userId, limit: sermonIds.length })
      : getSermons({ userId, limit: 4 }),
  ])

  // Keep the admin's chosen order rather than whatever order the query returned.
  const ordered = <T extends { id: number }>(items: T[], ids: number[]) =>
    ids.length ? ids.map(id => items.find(i => i.id === id)).filter((i): i is T => !!i) : items.slice(0, 4)

  return { hymns: ordered(hymns.hymns, hymnIds), sermons: ordered(sermons.sermons, sermonIds) }
}

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const [session, jar, { resume }] = await Promise.all([auth(), cookies(), searchParams])
  const tz = jar.get("tz")?.value
  const today = localToday(tz)
  const hour = localHour(tz)
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  const [plan, listen] = await Promise.all([
    userId ? getActivePlan(userId, today) : Promise.resolve(null),
    listenItems(userId),
  ])

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? null

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <TimezoneSync />
      <main className="pt-16">
        <TodayHero today={today} hour={hour} firstName={firstName} />

        {/* The plan card rises into the hero, so the page's main feature is
            the first thing below the greeting rather than below the fold. */}
        <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
          <ReadingPlanSection plan={plan} signedIn={!!userId} today={today} resume={resume === "1"} />
        </div>

        <div className="mx-auto mt-16 max-w-6xl space-y-16 px-4 pb-20 sm:px-6 lg:px-8">
          <ExploreGrid />
          <ListenSection hymns={listen.hymns} sermons={listen.sermons} userId={userId} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
