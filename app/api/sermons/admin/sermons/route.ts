import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSermonAdminAccess } from '@/lib/auth-helpers'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!hasSermonAdminAccess(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // This used to be an unbounded findMany with `include`, so a single call
  // serialised every sermon — descriptions, suggestions and all — out of
  // Postgres and then again out of the function. Paginated, explicit columns.
  const page = Math.max(1, parseInt(new URL(req.url).searchParams.get('page') ?? '1') || 1)

  const [sermons, total] = await Promise.all([
    prisma.smSermon.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        videoId: true,
        title: true,
        preacher: true,
        publishedAt: true,
        createdAt: true,
        clicksCount: true,
        thumbnailDefault: true,
        thumbnailMedium: true,
        approvalStatus: { select: { id: true, name: true } },
        channel: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.smSermon.count(),
  ])

  return NextResponse.json({ sermons, total })
}
