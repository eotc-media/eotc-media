import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { hasHymnAdminAccess } from '@/lib/auth-helpers'

// Lyrics suggestions are a contribution queue: any signed-in member proposes,
// an admin approves or declines. Both handlers used to require that the member
// had submitted the hymn themselves, which meant in practice that nobody could
// suggest lyrics for the hymns that needed them, and no suggestions arrived to
// review.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const hymnId = parseInt(slug)
  if (!Number.isFinite(hymnId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hymn = await prisma.hmHymn.findUnique({
    where: { id: hymnId },
    select: { id: true, userId: true, lyricsSuggestion: true },
  })
  if (!hymn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const lyrics = typeof body.lyrics === 'string' ? body.lyrics.trim() : ''
  if (!lyrics) return NextResponse.json({ error: 'Lyrics required' }, { status: 400 })

  // One pending slot per hymn. Without this, a second contributor's save
  // silently overwrites the first one's work before anyone has reviewed it.
  // The hymn's own submitter and admins may still replace what is pending.
  const userId = parseInt(session.user.id)
  const mayReplace = hasHymnAdminAccess(session) || hymn.userId === userId
  if (hymn.lyricsSuggestion && !mayReplace) {
    return NextResponse.json(
      { error: 'Someone has already suggested lyrics for this hymn and they are awaiting review.' },
      { status: 409 }
    )
  }

  await prisma.hmHymn.update({
    where: { id: hymnId },
    data: { lyricsSuggestion: sanitizeHtml(lyrics) },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = parseInt(session.user.id)

  const { slug } = await params
  const hymnId = parseInt(slug)
  if (!Number.isFinite(hymnId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const hymn = await prisma.hmHymn.findUnique({
    where: { id: hymnId },
    select: { id: true, userId: true },
  })
  if (!hymn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Discarding someone else's pending contribution is a moderation action, so
  // this stays with the hymn's submitter and hymn admins. (There is no column
  // recording who wrote a suggestion, so a contributor cannot be recognised
  // here as the author of their own.)
  if (!hasHymnAdminAccess(session) && hymn.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.hmHymn.update({ where: { id: hymnId }, data: { lyricsSuggestion: null } })
  return NextResponse.json({ success: true })
}
