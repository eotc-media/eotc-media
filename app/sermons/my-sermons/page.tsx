import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { getSermons } from "@/lib/api/sermons"
import Navbar from "@/components/Navbar"
import SermonSidebar from "@/components/sermons/SermonSidebar"
import SermonMyList from "@/components/sermons/SermonMyList"

export const metadata: Metadata = { title: "My sermons | EOTC Media" }

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function MySermonPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")
  const userId = parseInt(session.user.id)

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)

  const { sermons, total } = await getSermons({ page, limit: PAGE_SIZE, userId, view: "my-sermons" })
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">
        <div >
          <SermonSidebar userId={userId} />
          <main className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-10 py-6">
            <SermonMyList
              sermons={sermons}
              total={total}
              page={page}
              totalPages={totalPages}
              baseUrl="/sermons/my-sermons"
            />
          </main>
        </div>
      </div>
    </div>
  )
}
