import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import ChannelCheck, { type CheckedVideo } from "@/components/admin/sermons/ChannelCheck"

export const dynamic = "force-dynamic"

export default async function ChannelCheckPage() {
  const [rows, channels] = await Promise.all([
    prisma.smChannelVideo.findMany({
      orderBy: { checkedAt: "desc" },
      take: 200,
      select: {
        videoId: true, title: true, publishedAt: true, durationSeconds: true, verdict: true, reason: true, checkedAt: true,
        channel: { select: { name: true } },
        sermon: { select: { id: true, approvalStatus: { select: { name: true } } } },
      },
    }),
    prisma.smChannel.count({ where: { ytChannelId: { not: null }, sermons: { some: { approvalStatus: { name: "Accepted" } } } } }),
  ])
  const videos: CheckedVideo[] = rows.map(r => ({
    videoId: r.videoId,
    title: r.title,
    channel: r.channel.name,
    minutes: r.durationSeconds ? Math.round(r.durationSeconds / 60) : null,
    verdict: r.verdict,
    reason: r.reason,
    checkedAt: r.checkedAt.toISOString(),
    sermonStatus: r.sermon?.approvalStatus.name ?? null,
  }))
  return (
    <div className="space-y-6">
      <PageHeader
        title="Channel check"
        description={`Every day the site looks at new videos on the ${channels} channels it has sermons from. Gemini picks out the sermons. Clear cases (Gemini is sure, and the preacher is one you already have) are published straight away; the rest wait under New sermons for you. Videos it passed over are listed too, in case it was wrong.`}
      />
      <ChannelCheck videos={videos} />
    </div>
  )
}
