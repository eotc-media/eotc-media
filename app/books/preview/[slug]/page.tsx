import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"
import { getLibraryBook } from "@/lib/library-shelves"
import Navbar from "@/components/Navbar"
import LibraryBookPage from "@/components/library/LibraryBookPage"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Library (preview) — EOTC Media", robots: { index: false, follow: false } }

export default async function LibraryBookPreview({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeURIComponent((await params).slug)
  const session = await auth()
  const book = await getLibraryBook(slug, session?.user?.id ? parseInt(session.user.id) : undefined)
  if (!book) notFound()
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <LibraryBookPage book={book} signedIn={!!session?.user} home="/books/preview" liveHref={`/books/${encodeURIComponent(book.slug)}`} />
      </main>
    </>
  )
}
