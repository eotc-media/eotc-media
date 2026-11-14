import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getShelf } from "@/lib/library-shelves"
import Navbar from "@/components/Navbar"
import ShelfGrid from "@/components/library/ShelfGrid"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Library (preview) — EOTC Media", robots: { index: false, follow: false } }

export default async function ShelfPreview({ params }: { params: Promise<{ key: string }> }) {
  const shelf = await getShelf((await params).key)
  if (!shelf) notFound()
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <ShelfGrid shelf={shelf} home="/books/preview" />
      </main>
    </>
  )
}
