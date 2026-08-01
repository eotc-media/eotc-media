import { permanentRedirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

// Short share link: /h/123 → the canonical /hymns/<slug> page.
// Keeps shared URLs compact instead of the long percent-encoded Amharic slug.
// Permanent (308) so search engines consolidate a shared short link into the
// canonical slug page instead of indexing it as a separate duplicate URL.
export const dynamic = "force-dynamic"

export default async function ShortHymnLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const n = parseInt(id)
  if (!Number.isInteger(n)) notFound()

  const hymn = await prisma.hmHymn.findUnique({ where: { id: n }, select: { slug: true } })
  if (!hymn) notFound()

  permanentRedirect(`/hymns/${hymn.slug}`)
}
