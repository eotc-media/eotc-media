import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateFromYoutubeVideo, stripCodeFence } from '@/lib/generate-lyrics'

// Reading a whole video takes longer than reading a subtitle file did.
export const maxDuration = 60

const PROMPT = `Listen to this religious hymn video and write out its lyrics as clean, properly structured HTML.

Rules:

Transcription: Transcribe the sung lyrics accurately. Use your knowledge of the hymn and the language (Amharic, Tigrinya, Oromo or English) to render words correctly.

Structure: Use <p> tags for each verse or stanza and <br> for line breaks within a verse.

Cleanup: Do not include spoken intros, outros, announcements, or repeated ad-lib filler.

Preservation: Keep the original language; do not translate.

Output: Do not add any explanation or preamble. Output only the HTML.`

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params

  // slug may be a numeric id (from LyricsPanel) or a real slug
  const hymnId = parseInt(slug)
  const hymn = isNaN(hymnId)
    ? await prisma.hmHymn.findUnique({ where: { slug }, select: { id: true, videoId: true } })
    : await prisma.hmHymn.findUnique({ where: { id: hymnId }, select: { id: true, videoId: true } })

  if (!hymn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let lyrics: string
  try {
    lyrics = stripCodeFence(await generateFromYoutubeVideo(hymn.videoId, PROMPT))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-lyrics]', hymn.videoId, msg)
    return NextResponse.json({ error: `Could not generate lyrics. ${msg}` }, { status: 502 })
  }

  // Save to dedicated aiLyrics column for admin review
  await prisma.hmHymn.update({
    where: { id: hymn.id },
    data: { aiLyrics: lyrics },
  })

  return NextResponse.json({ lyrics })
}
