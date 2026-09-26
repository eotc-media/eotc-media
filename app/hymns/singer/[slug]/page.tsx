import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getHymns, getHymnsFilterData } from "@/lib/api/hymns"
import Navbar from "@/components/Navbar"
import HymnSidebar from "@/components/hymns/HymnSidebar"
import HymnSearchFilters from "@/components/hymns/HymnSearchFilters"
import HymnInfiniteGrid from "@/components/hymns/HymnInfiniteGrid"
import Link from "next/link"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    language?: string
    category?: string
    subCategory?: string
    sort?: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const singer = await prisma.hmSinger.findUnique({ where: { slug: decodeURIComponent(slug) } })
  if (!singer) return { title: "Singer — EOTC Media" }
  return { title: `Hymns by ${singer.name} — EOTC Media` }
}

const PAGE_SIZE = 24

export default async function SingerHymnsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const singerSlug = decodeURIComponent(slug)

  const { language, category, subCategory, sort } = await searchParams

  const languageId = language ? parseInt(language) || undefined : undefined
  const categoryId = category ? parseInt(category) || undefined : undefined
  const subCategoryId = subCategory ? parseInt(subCategory) || undefined : undefined

  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  // The hymn query needs the singer's id, so the lookup can no longer run
  // alongside it. The filter data still can.
  const [singer, { categories, subCategories, languages, singers, singersByLanguage }] =
    await Promise.all([
      prisma.hmSinger.findUnique({ where: { slug: singerSlug } }),
      getHymnsFilterData(),
    ])

  if (!singer) notFound()

  const { hymns, total } = await getHymns({
    singerId: singer.id, languageId, categoryId, subCategoryId, sort, userId,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const basePath = `/hymns/singer/${slug}`

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-full mx-auto lg:grid lg:grid-cols-[220px_1fr]">

          <HymnSidebar userId={userId} />

          <main className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Singer header */}
            <div className="mb-5">
              <h1 className="text-base font-semibold text-slate-900">
                Hymns by <span className="text-blue-700">{singer.name}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {total.toLocaleString()} {total === 1 ? "mezmur" : "mezmurat"}
                <span className="mx-1.5">·</span>
                <Link href="/hymns" className="hover:underline">ወደ ዋናው የመዝሙራት ዝርዝር</Link>
              </p>
            </div>

            {/* Filters — language / category / sub-category only (no "By Singer" option) */}
            <div className="mb-5">
              <HymnSearchFilters
                categories={categories}
                subCategories={subCategories}
                languages={languages}
                singers={singers}
                singersByLanguage={singersByLanguage}
                basePath={basePath}
                hideSingerMode
              />
            </div>

            <HymnInfiniteGrid
              initialHymns={hymns}
              initialTotal={total}
              initialTotalPages={totalPages}
              filters={{ language, category, subCategory, singer: String(singer.id), sort }}
              userId={userId}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
