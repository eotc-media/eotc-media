import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getSermons, getSermonsFilterData } from "@/lib/api/sermons"
import Navbar from "@/components/Navbar"
import SermonSidebar from "@/components/sermons/SermonSidebar"
import SermonSearchFilters from "@/components/sermons/SermonSearchFilters"
import SermonInfiniteGrid from "@/components/sermons/SermonInfiniteGrid"
import Link from "next/link"

// The sermon counterpart of /hymns/singer/[slug]. A preacher's name was shown
// on every sermon card and linked to nothing, so there was no way to see what
// else they had preached.

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
  const preacher = await prisma.smPreacher.findUnique({ where: { slug: decodeURIComponent(slug) } })
  if (!preacher) return { title: "Preacher — EOTC Media" }
  return {
    title: `Sermons by ${preacher.name} — EOTC Media`,
    description:
      `Ethiopian and Eritrean Orthodox Tewahedo Church sermons by ${preacher.name}. ` +
      `የ${preacher.name} ስብከቶች።`,
    alternates: { canonical: `/sermons/preacher/${encodeURIComponent(preacher.slug)}` },
  }
}

const PAGE_SIZE = 24

export default async function PreacherSermonsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const preacherSlug = decodeURIComponent(slug)

  const { language, category, subCategory, sort } = await searchParams

  const languageId = language ? parseInt(language) || undefined : undefined
  const categoryId = category ? parseInt(category) || undefined : undefined
  const subCategoryId = subCategory ? parseInt(subCategory) || undefined : undefined

  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  // The sermon query needs the preacher's id, so the lookup runs first. The
  // filter data still runs alongside it.
  const [preacher, { categories, subCategories, languages, categoriesByLanguage }] =
    await Promise.all([
      prisma.smPreacher.findUnique({ where: { slug: preacherSlug } }),
      getSermonsFilterData(),
    ])

  if (!preacher) notFound()

  const { sermons, total } = await getSermons({
    preacherId: preacher.id, languageId, categoryId, subCategoryId, sort, userId,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const basePath = `/sermons/preacher/${slug}`

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-full mx-auto lg:grid lg:grid-cols-[220px_1fr]">

          <SermonSidebar userId={userId} />

          <main className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Preacher header */}
            <div className="mb-5">
              <h1 className="text-base font-semibold text-slate-900">
                Sermons by <span className="text-blue-700">{preacher.name}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {total.toLocaleString()} {total === 1 ? "sermon" : "sermons"}
                <span className="mx-1.5">·</span>
                <Link href="/sermons" className="hover:underline">ወደ ዋናው የስብከቶች ዝርዝር</Link>
              </p>
            </div>

            <div className="mb-5">
              <SermonSearchFilters
                categories={categories}
                subCategories={subCategories}
                languages={languages}
                categoriesByLanguage={categoriesByLanguage}
                basePath={basePath}
              />
            </div>

            <SermonInfiniteGrid
              initialSermons={sermons}
              initialTotal={total}
              initialTotalPages={totalPages}
              filters={{ language, category, subCategory, preacher: String(preacher.id), sort }}
              userId={userId}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
