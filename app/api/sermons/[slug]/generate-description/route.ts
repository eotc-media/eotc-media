import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateFromYoutubeVideo } from '@/lib/generate-lyrics'

// Reading a whole video takes longer than reading a subtitle file did.
export const maxDuration = 60

const PROMPT = `Listen to this religious sermon video and write a concise description (2-4 sentences) summarising its main topic and message. Write in the language spoken in the video; do not translate. Output only the description, with no extra commentary.`

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const sermonId = parseInt(slug)
  if (!Number.isFinite(sermonId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Open to any signed-in member, matching the hymn side: the output is a draft
  // for the suggestion queue, not a published edit.
  const sermon = await prisma.smSermon.findUnique({
    where: { id: sermonId },
    select: { videoId: true },
  })
  if (!sermon) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const description = await generateFromYoutubeVideo(sermon.videoId, PROMPT)
    return NextResponse.json({ description })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[generate-description]', sermon.videoId, msg)
    return NextResponse.json({ error: `Could not generate description. ${msg}` }, { status: 502 })
  }
}
