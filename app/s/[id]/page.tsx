import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

// Short link: /s/123 → the canonical /sermons/<slug> page. See app/h/[id] for
// why this is a temporary redirect rather than a permanent one.
export const dynamic = "force-dynamic"

export default async function ShortSermonLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const n = Number(id)
  if (!Number.isInteger(n) || n <= 0) notFound()

  const sermon = await prisma.smSermon.findUnique({ where: { id: n }, select: { slug: true } })
  if (!sermon) notFound()

  redirect(`/sermons/${sermon.slug}`)
}
