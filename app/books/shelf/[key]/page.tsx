import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getShelf } from "@/lib/library-shelves"
import Navbar from "@/components/Navbar"
import ShelfGrid from "@/components/library/ShelfGrid"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const shelf = await getShelf((await params).key)
  if (!shelf) return { title: "Shelf not found" }
  return {
    title: `${shelf.en} — Spiritual Books | ${shelf.am}`,
    alternates: { canonical: `/books/shelf/${shelf.key}` },
  }
}

export default async function ShelfPage({ params }: { params: Promise<{ key: string }> }) {
  const shelf = await getShelf((await params).key)
  if (!shelf) notFound()
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <ShelfGrid shelf={shelf} home="/books" />
      </main>
    </>
  )
}
