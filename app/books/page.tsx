import type { Metadata } from "next"
import { auth } from "@/auth"
import { getBooks, getBooksFilterData } from "@/lib/api/books"
import Navbar from "@/components/Navbar"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getLibraryHome } from "@/lib/library-shelves"
import LibraryHome from "@/components/library/LibraryHome"
import BookSearchFilters from "@/components/books/BookSearchFilters"
import BookInfiniteGrid from "@/components/books/BookInfiniteGrid"

export const metadata: Metadata = {
  title: "Spiritual Books — Ethiopian Orthodox Library | መንፈሳዊ መጻሕፍት",
  description:
    "Read Amharic spiritual books by early church fathers and contemporary Ethiopian Orthodox Tewahedo teachers. " +
    "በቀደሙ የቤተ ክርስቲያን አባቶችና በአሁኑ ዘመን መምህራን የተጻፉ መንፈሳዊ መጻሕፍት በአማርኛ።",
  keywords: [
    "Amharic spiritual books", "Ethiopian Orthodox books", "church fathers books", "Orthodox Tewahedo books",
    "መንፈሳዊ መጻሕፍት", "የቤተ ክርስቲያን መጻሕፍት", "የአባቶች መጻሕፍት", "የኦርቶዶክስ መጻሕፍት",
  ],
  alternates: { canonical: "/books" },
  openGraph: {
    title: "Spiritual Books — Ethiopian Orthodox Library | መንፈሳዊ መጻሕፍት",
    description: "Read Amharic spiritual books by church fathers and EOTC teachers. መንፈሳዊ መጻሕፍት በአማርኛ።",
    url: "/books",
  },
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ language?: string; category?: string; subCategory?: string; sort?: string; search?: string; all?: string }>
}

/** The library's shelves; with a search or filters, the full list of books. */
export default async function BooksPage({ searchParams }: PageProps) {
  const { language, category, subCategory, sort, search, all } = await searchParams
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  if (!(language || category || subCategory || sort || search?.trim() || all)) {
    const home = await getLibraryHome(userId)
    return (
      <>
        <Navbar />
        <main className="pt-16">
          <LibraryHome home={home} bookHref="/books" signedIn={!!userId} />
        </main>
      </>
    )
  }

  const languageId = language ? parseInt(language) || undefined : undefined
  const categoryId = category ? parseInt(category) || undefined : undefined
  const subCategoryId = subCategory ? parseInt(subCategory) || undefined : undefined

  const [{ books, total }, { categories, subCategories, languages, categoriesByLanguage }] = await Promise.all([
    getBooks({ languageId, categoryId, subCategoryId, sort, search }),
    getBooksFilterData(),
  ])

  const totalPages = Math.ceil(total / 24)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">
        <div className="mx-auto max-w-7xl">
          <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10">
            <Link href="/books" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Books
            </Link>
            <div className="mb-6 mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <BookSearchFilters
                categories={categories}
                subCategories={subCategories}
                languages={languages}
                categoriesByLanguage={categoriesByLanguage}
              />
            </div>
            <BookInfiniteGrid
              initialBooks={books}
              initialTotal={total}
              initialTotalPages={totalPages}
              filters={{ language, category, subCategory, sort, search }}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
