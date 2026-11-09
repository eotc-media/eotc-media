import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateFromYoutubeVideo, stripCodeFence } from '@/lib/generate-lyrics'
import { transcriptionPrompt, reviewTranscript, lyricsToText, type HymnContext } from '@/lib/lyrics-check'
import { sanitizeHtml } from '@/lib/sanitize-html'

// Listening to a whole video, then a second model checking the result, can take
// over a minute; the Pro plan allows this.
export const maxDuration = 120

const UNCLEAR = "The lyrics in this video could not be made out reliably, so nothing was saved. You can add them yourself with Edit."

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params

  // slug may be a numeric id (from LyricsPanel) or a real slug
  const hymnId = parseInt(slug)
  const select = {
    id: true,
    videoId: true,
    title: true,
    singer: true,
    singers: { select: { singer: { select: { name: true } } } },
    languages: { select: { language: { select: { name: true } } } },
  } as const
  const hymn = isNaN(hymnId)
    ? await prisma.hmHymn.findUnique({ where: { slug }, select })
    : await prisma.hmHymn.findUnique({ where: { id: hymnId }, select })

  if (!hymn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ctx: HymnContext = {
    title: hymn.title,
    singers: [...new Set([hymn.singer, ...hymn.singers.map(s => s.singer.name)].filter((n): n is string => !!n))],
    languages: hymn.languages.map(l => l.language.name),
  }

  // 1. Transcribe, with permission to say the words can't be made out.
  let parsed: { status?: string; lyrics_html?: string }
  try {
    const raw = await generateFromYoutubeVideo(hymn.videoId, transcriptionPrompt(ctx), { json: true })
    parsed = JSON.parse(stripCodeFence(raw))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-lyrics]', hymn.videoId, msg)
    return NextResponse.json({ error: `Could not generate lyrics. ${msg}` }, { status: 502 })
  }

  if (parsed.status === 'no_lyrics') {
    return NextResponse.json({ error: 'This video has no sung lyrics to transcribe.' }, { status: 422 })
  }
  const lyrics = sanitizeHtml(parsed.lyrics_html ?? '')
  const text = lyricsToText(lyrics)
  if (parsed.status !== 'ok' || text.replace(/\s/g, '').length < 40) {
    return NextResponse.json({ error: UNCLEAR }, { status: 422 })
  }

  // 2. A second, independent read: is this real, meaningful language?
  const verdict = await reviewTranscript(text, ctx)
  if (!verdict.ok) {
    console.warn('[generate-lyrics] rejected', hymn.videoId, verdict.reason)
    return NextResponse.json({ error: UNCLEAR }, { status: 422 })
  }

  // Saved to the aiLyrics column, shown marked as AI-written until a member or
  // admin edits or approves it.
  await prisma.hmHymn.update({
    where: { id: hymn.id },
    data: { aiLyrics: lyrics },
  })

  return NextResponse.json({ lyrics })
}
