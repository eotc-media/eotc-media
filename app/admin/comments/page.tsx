import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import FallbackImage from "@/components/FallbackImage"
import { cardThumbCandidates } from "@/lib/thumbnails"

const PAGE_SIZE = 100

export default async function AdminCommentsPage() {
  // Cap the page rather than loading every comment ever written; `total` still
  // reports the real count.
  const [comments, total] = await Promise.all([
    prisma.hmComment.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, image: true } },
        hymn: {
          select: {
            id: true, title: true, slug: true, videoId: true,
            thumbnailDefault: true, thumbnailMedium: true, thumbnailHigh: true,
          },
        },
      },
    }),
    prisma.hmComment.count(),
  ])

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="Comments"
        description={
          `${total.toLocaleString()} hymn comment${total !== 1 ? "s" : ""}` +
          (total > comments.length ? ` · showing the latest ${comments.length}` : "")
        }
      />

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}

      <div className="space-y-3">
        {comments.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4">
              {/* Hymn row */}
              <Link
                href={`/hymns/${c.hymn.slug}`}
                className="mb-3 flex items-center gap-3 group"
                target="_blank"
              >
                <span className="relative block h-9 w-16 flex-shrink-0 overflow-hidden rounded bg-muted">
                  <FallbackImage
                    candidates={cardThumbCandidates(c.hymn)}
                    alt={c.hymn.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </span>
                <span className="text-sm font-medium text-foreground group-hover:underline line-clamp-1">
                  {c.hymn.title}
                </span>
              </Link>

              {/* Comment row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {(c.user.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">{c.user.name}</p>
                    <p className="text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap">{c.comment}</p>
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
