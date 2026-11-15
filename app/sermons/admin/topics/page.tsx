import { prisma } from "@/lib/prisma"
import { getTopics, TOPIC_GROUPS } from "@/lib/sermon-topics"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import TopicReview, { type ReviewSermon } from "@/components/admin/sermons/TopicReview"

export const dynamic = "force-dynamic"

export default async function SermonTopicsPage() {
  const [topics, sermons] = await Promise.all([
    getTopics(),
    prisma.smSermon.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true, slug: true, title: true, thumbnailMedium: true,
        channel: { select: { name: true } },
        categories: { select: { category: { select: { name: true } } } },
        subCategories: { select: { subCategory: { select: { name: true } } } },
        topics: { select: { topicId: true, source: true, approvedAt: true }, orderBy: { id: "asc" } },
      },
    }),
  ])
  const rows: ReviewSermon[] = sermons.map(s => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    image: s.thumbnailMedium,
    channel: s.channel.name,
    previous: [...s.categories.map(c => c.category.name), ...s.subCategories.map(c => c.subCategory.name)],
    topicIds: s.topics.map(t => t.topicId),
    approved: s.topics.length > 0 && s.topics.every(t => t.approvedAt !== null),
  }))
  return (
    <div className="space-y-6">
      <PageHeader
        title="Topics"
        description="Gemini suggests up to three topics per sermon from its title and description. Check them, change any that are wrong, and approve; only approved topics show on the site."
      />
      <TopicReview sermons={rows} topics={topics} groups={TOPIC_GROUPS.map(g => ({ key: g.key, en: g.en }))} />
    </div>
  )
}
