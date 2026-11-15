import type { Metadata } from "next"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import SermonSidebar from "@/components/sermons/SermonSidebar"
import SermonChannelInfiniteGrid from "@/components/sermons/SermonChannelInfiniteGrid"

export const metadata: Metadata = { title: "Channels — Sermons | EOTC Media" }

const PAGE_SIZE = 24

export default async function SermonChannelsPage() {
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  const [channels, total] = await Promise.all([
    prisma.smChannel.findMany({
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      include: { _count: { select: { sermons: true } } },
    }),
    prisma.smChannel.count(),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">
        <div >
          <SermonSidebar userId={userId} />
          <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-6">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900">Channels</h1>
            <SermonChannelInfiniteGrid
              initialChannels={channels}
              initialTotal={total}
              initialTotalPages={totalPages}
            />
          </main>
        </div>
      </div>
    </div>
  )
}
