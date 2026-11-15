import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { getLibraryBook } from "@/lib/library-shelves"
import { absoluteUrl, jsonLd } from "@/lib/seo"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import LibraryBookPage from "@/components/library/LibraryBookPage"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug)
  const book = await prisma.cbBook.findUnique({ where: { slug }, select: { name: true, author: true, description: true } })
  if (!book) return { title: "Book Not Found" }
  const description =
    book.description ??
    `Read the spiritual book "${book.name}" by ${book.author} on EOTC Media. ` +
    `"${book.name}" መንፈሳዊ መጽሐፍ በ${book.author} ያንብቡ።`
  return {
    title: `${book.name} — Spiritual Book | መንፈሳዊ መጽሐፍ`,
    description,
    keywords: [
      book.name, book.author, "Amharic spiritual book", "Ethiopian Orthodox book",
      "መንፈሳዊ መጽሐፍ", "የቤተ ክርስቲያን መጽሐፍ",
    ],
    alternates: { canonical: `/books/${encodeURIComponent(slug)}` },
    openGraph: {
      title: `${book.name} — Spiritual Book | መንፈሳዊ መጽሐፍ`,
      description,
      url: `/books/${encodeURIComponent(slug)}`,
      type: "book",
    },
  }
}

export default async function BookPage({ params }: PageProps) {
  const slug = decodeURIComponent((await params).slug)
  const session = await auth()
  const book = await getLibraryBook(slug, session?.user?.id ? parseInt(session.user.id) : undefined)
  if (!book) notFound()
  const url = absoluteUrl(`/books/${encodeURIComponent(slug)}`)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.name,
            author: { "@type": "Person", name: book.author },
            description: book.description ?? undefined,
            url,
            inLanguage: "am",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Spiritual Books", item: absoluteUrl("/books") },
              { "@type": "ListItem", position: 3, name: book.name, item: url },
            ],
          }),
        }}
      />
      <Navbar />
      <main className="pt-16">
        <LibraryBookPage book={book} signedIn={!!session?.user} />
      </main>
    </>
  )
}
