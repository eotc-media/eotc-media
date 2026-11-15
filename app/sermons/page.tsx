import type { Metadata } from "next"
import { auth } from "@/auth"
import { getSermons, getSermonsFilterData, getTopicsInUse } from "@/lib/api/sermons"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import SermonSidebar from "@/components/sermons/SermonSidebar"
import SermonsHeader from "@/components/sermons/SermonsHeader"
import SermonInfiniteGrid from "@/components/sermons/SermonInfiniteGrid"
import SermonCard from "@/components/sermons/SermonCard"
import { Star } from "lucide-react"

export const metadata: Metadata = {
  title: "Sermons — Ethiopian Orthodox Tewahedo Teachings | ስብከቶች",
  description:
    "Watch and listen to Ethiopian Orthodox Tewahedo Church sermons and spiritual teachings in Amharic, " +
    "organized by preacher, category and language. " +
    "የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ስብከቶች እና ትምህርቶች — በሰባኪ፣ በምድብ እና በቋንቋ ተደራጅተው።",
  keywords: [
    "Ethiopian Orthodox sermons", "Amharic sermons", "EOTC teachings", "Orthodox Tewahedo sermon",
    "ስብከት", "ስብከቶች", "የኦርቶዶክስ ስብከት", "መንፈሳዊ ትምህርት",
  ],
  alternates: { canonical: "/sermons" },
  openGraph: {
    title: "Sermons — Ethiopian Orthodox Tewahedo Teachings | ስብከቶች",
    description: "Watch EOTC sermons and spiritual teachings. የኦርቶዶክስ ተዋሕዶ ስብከቶች እና ትምህርቶች።",
    url: "/sermons",
  },
}

const PAGE_SIZE = 24

interface PageProps {
  searchParams: Promise<{
    language?: string
    category?: string
    subCategory?: string
    search?: string
    sort?: string
    topic?: string
  }>
}

export default async function SermonsPage({ searchParams }: PageProps) {
  const { language, category, subCategory, search, sort, topic } = await searchParams

  const languageId = language ? parseInt(language) || undefined : undefined
  const categoryId = category ? parseInt(category) || undefined : undefined
  const subCategoryId = subCategory ? parseInt(subCategory) || undefined : undefined

  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  const filtered = !!(language || category || subCategory || search || topic)
  const [{ sermons, total }, { languages }, featuredRecords, topics, all] =
    await Promise.all([
      getSermons({ languageId, categoryId, subCategoryId, search, sort, userId, topic }),
      getSermonsFilterData(),
      filtered ? Promise.resolve([]) : prisma.featuredItem.findMany({ where: { moduleType: "sermon" }, orderBy: { orderBy: "asc" } }),
      getTopicsInUse(),
      prisma.smSermon.count({ where: { approvalStatus: { name: "Accepted" } } }),
    ])

  const { sermons: featuredSermonsRaw } = featuredRecords.length > 0
    ? await getSermons({ itemIds: featuredRecords.map(f => f.itemId), userId, limit: featuredRecords.length })
    : { sermons: [] }
  const featuredSermons = featuredRecords
    .map(f => featuredSermonsRaw.find(s => s.id === f.itemId))
    .filter(Boolean) as typeof featuredSermonsRaw

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">
        <SermonSidebar userId={userId} />
        <SermonsHeader
          total={all}
          topics={topics}
          languages={languages}
          current={{ search, topic, language, sort }}
        />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {featuredSermons.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Featured</h2>
              </div>
              <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredSermons.map(s => <SermonCard key={s.id} sermon={s} userId={userId} />)}
              </div>
            </section>
          )}
          <SermonInfiniteGrid
            initialSermons={sermons}
            initialTotal={total}
            initialTotalPages={totalPages}
            filters={{ language, category, subCategory, search, sort, topic }}
            userId={userId}
          />
        </main>
      </div>
    </div>
  )
}
