import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { hasSermonAdminAccess } from '@/lib/auth-helpers'
import { handleRoute } from '@/lib/route-error'

// Mirrors the hymn lyrics queue: any signed-in member may suggest a
// description, an admin approves or declines it. Previously restricted to the
// member who submitted the sermon, which left nobody able to contribute.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleRoute('suggest-description POST', async () => {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slug } = await params
    const sermonId = parseInt(slug)
    if (!Number.isFinite(sermonId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const sermon = await prisma.smSermon.findUnique({
      where: { id: sermonId },
      select: { id: true, userId: true, descriptionSuggestion: true },
    })
    if (!sermon) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    if (!description) return NextResponse.json({ error: 'Description required' }, { status: 400 })

    // One pending slot per sermon — see the note in the hymn route.
    const userId = parseInt(session.user.id)
    const mayReplace = hasSermonAdminAccess(session) || sermon.userId === userId
    if (sermon.descriptionSuggestion && !mayReplace) {
      return NextResponse.json(
        { error: 'Someone has already suggested a description for this sermon and it is awaiting review.' },
        { status: 409 }
      )
    }

    await prisma.smSermon.update({
      where: { id: sermonId },
      data: { descriptionSuggestion: sanitizeHtml(description) },
    })

    return NextResponse.json({ success: true })
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleRoute('suggest-description DELETE', async () => {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = parseInt(session.user.id)

    const { slug } = await params
    const sermonId = parseInt(slug)
    if (!Number.isFinite(sermonId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const sermon = await prisma.smSermon.findUnique({
      where: { id: sermonId },
      select: { id: true, userId: true },
    })
    if (!sermon) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!hasSermonAdminAccess(session) && sermon.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.smSermon.update({ where: { id: sermonId }, data: { descriptionSuggestion: null } })
    return NextResponse.json({ success: true })
  })
}
