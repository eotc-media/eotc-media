import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { auth } from "@/auth"
import { getBookReading, saveReadingProgress } from "@/lib/books-reader"
import Navbar from "@/components/Navbar"
import BookReader from "@/components/books/BookReader"
import PdfReader from "@/components/books/PdfReader"
import { prisma } from "@/lib/prisma"
import { bookFileUrl } from "@/lib/book-assets"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ch?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug)
  return {
    title: "Read online — EOTC Media",
    alternates: { canonical: `/books/${encodeURIComponent(slug)}/read` },
  }
}

export default async function ReadBookPage({ params, searchParams }: Props) {
  const [{ slug: raw }, { ch }] = await Promise.all([params, searchParams])
  const slug = decodeURIComponent(raw)
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  const reading = await getBookReading(slug, userId, Number(ch) || undefined)
  if (!reading) {
    // Not one of the texts read chapter by chapter: read its PDF in the page.
    const book = await prisma.cbBook.findUnique({ where: { slug }, select: { slug: true, name: true, file: true } })
    if (!book?.file) notFound()
    const own = `/api/books/files/${encodeURIComponent(book.file)}`
    const urls = [...new Set([bookFileUrl(book.file), own])]
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <main className="pt-16">
          <PdfReader slug={book.slug} name={book.name.replace(/\s+/g, " ").trim()} urls={urls} download={bookFileUrl(book.file)} />
        </main>
      </div>
    )
  }

  // Remember the chapter, after the page is sent.
  if (userId) after(() => saveReadingProgress(userId, reading.work.slug, reading.current.index, reading.range))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-16">
        <BookReader key={reading.current.sectionId} reading={reading} />
      </main>
    </div>
  )
}
