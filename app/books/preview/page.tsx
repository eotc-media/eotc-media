import type { Metadata } from "next"
import { auth } from "@/auth"
import { getLibraryHome } from "@/lib/library-shelves"
import Navbar from "@/components/Navbar"
import LibraryHome from "@/components/library/LibraryHome"

// A preview of the redesigned Books section, next to the current one until the
// owner decides. Kept out of search results meanwhile.
export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Library (preview) — EOTC Media", robots: { index: false, follow: false } }

export default async function LibraryPreviewPage() {
  const session = await auth()
  const home = await getLibraryHome(session?.user?.id ? parseInt(session.user.id) : undefined)
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <LibraryHome home={home} bookHref="/books/preview" />
      </main>
    </>
  )
}
