import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

// Short link: /h/123 → the canonical /hymns/<slug> page. Share buttons now
// copy the slug URL directly, so nothing new points here — this only keeps
// links already sent out working.
//
// Temporary rather than permanent: a 308 is cached by the browser for good,
// and the admin API can change a hymn's slug, which would leave anyone who
// followed the old link redirecting to a dead URL forever. The canonical tag
// on the target page is what consolidates these for search engines anyway.
export const dynamic = "force-dynamic"

export default async function ShortHymnLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const n = Number(id)
  if (!Number.isInteger(n) || n <= 0) notFound()

  const hymn = await prisma.hmHymn.findUnique({ where: { id: n }, select: { slug: true } })
  if (!hymn) notFound()

  redirect(`/hymns/${hymn.slug}`)
}
