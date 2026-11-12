import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import FathersReview from "./FathersReview"

export default async function AdminFathersWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const work = await prisma.cfWork.findUnique({
    where: { slug },
    select: {
      slug: true, title: true, author: true,
      sections: {
        orderBy: { position: "asc" },
        select: { id: true, position: true, title: true, titleAm: true, body: true, bodyAm: true, bodyAmApproved: true },
      },
    },
  })
  if (!work) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={work.title} description={`${work.author} · Amharic translation, chapter by chapter`} />
      <FathersReview slug={work.slug} sections={work.sections} />
    </div>
  )
}
