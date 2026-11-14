import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { readWorkAmharic, readWorkText } from "@/lib/library"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import FathersReview from "./FathersReview"

export default async function AdminFathersWorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const work = await prisma.cfWork.findUnique({
    where: { slug },
    select: {
      slug: true, title: true, author: true,
      sections: { orderBy: { position: "asc" }, select: { position: true, title: true } },
    },
  })
  if (!work) notFound()
  const [text, amharic] = await Promise.all([readWorkText(slug), readWorkAmharic(slug)])

  return (
    <div className="space-y-6">
      <PageHeader title={work.title} description={`${work.author} · Amharic translation, chapter by chapter`} />
      <FathersReview
        slug={work.slug}
        sections={work.sections.map(s => {
          const am = amharic.get(s.position)
          return {
            position: s.position,
            title: s.title,
            body: (text.get(s.position) ?? []).join("\n\n"),
            titleAm: am?.title ?? null,
            bodyAm: am ? am.paragraphs.join("\n\n") : null,
            bodyAmApproved: am?.approved ?? false,
          }
        })}
      />
    </div>
  )
}
