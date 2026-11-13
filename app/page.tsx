import type { Metadata } from "next"
import { cookies } from "next/headers"
import { after } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getHymns } from "@/lib/api/hymns"
import { getSermons } from "@/lib/api/sermons"
import { getActivePlans, getStoppedPlans, localHour, localToday } from "@/lib/reading-plan-server"
import { SITE_DESCRIPTION } from "@/lib/seo"
import { fillNameScripts, greetingNames } from "@/lib/name-script"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import TodayHero from "@/components/home/TodayHero"
import ReadingPlanSection from "@/components/home/ReadingPlanSection"
import ExploreGrid from "@/components/home/ExploreGrid"
import ListenSection from "@/components/home/ListenSection"
import TimezoneSync from "@/components/home/TimezoneSync"
import ContributeSection from "@/components/home/ContributeSection"

export const dynamic = "force-dynamic"

// Leads with what the site is for, not its name: the phrase people search for
// belongs in the strongest signal on the page.
export const metadata: Metadata = {
  title: { absolute: "Ethiopian Orthodox Tewahedo Church Resources | EOTC Media — Bible, Liturgy, Mezmur, Sermons, Books & Quiz" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
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

export default async function Home({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const [session, jar, { resume }] = await Promise.all([auth(), cookies(), searchParams])
  const tz = jar.get("tz")?.value
  const today = localToday(tz)
  const hour = localHour(tz)
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  const [plans, listen, me] = await Promise.all([
    userId ? Promise.all([getActivePlans(userId, today), getStoppedPlans(userId)]) : Promise.resolve(null),
    listenItems(userId),
    userId ? prisma.user.findUnique({ where: { id: userId }, select: { name: true, nameAm: true, nameEn: true } }) : null,
  ])

  // The greeting reads the stored spellings. An account that has not got both
  // yet has the missing one spelled once, after this page is sent, so the
  // next visit greets in the right alphabet.
  const greetName = me ? greetingNames(me) : null
  if (userId && me && (!me.nameAm || !me.nameEn)) after(() => fillNameScripts(userId))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <TimezoneSync />
      <main className="pt-16">
        <TodayHero today={today} hour={hour} name={greetName} />

        {/* The plan card rises into the hero, so the page's main feature is
            the first thing below the greeting rather than below the fold. */}
        <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
          <ReadingPlanSection plans={plans?.[0] ?? []} stopped={plans?.[1] ?? []} signedIn={!!userId} today={today} resume={resume === "1"} />
        </div>

        <div className="mx-auto mt-16 max-w-6xl space-y-16 px-4 pb-20 sm:px-6 lg:px-8">
          <ExploreGrid />
          <ListenSection hymns={listen.hymns} sermons={listen.sermons} userId={userId} />
        </div>
        <ContributeSection signedIn={!!userId} />
      </main>
      <Footer />
    </div>
  )
}
