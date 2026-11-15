import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { hasSermonAdminAccess } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { fetchVideoDetails } from "@/lib/youtube"
import { addPendingSermon } from "@/lib/sermon-watch"

// A video the check passed over that is a sermon after all: add it as pending.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const session = await auth()
  if (!hasSermonAdminAccess(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { videoId } = await params
  const row = await prisma.smChannelVideo.findUnique({ where: { videoId } })
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (row.sermonId || await prisma.smSermon.findFirst({ where: { videoId }, select: { id: true } })) {
    return NextResponse.json({ error: "Already a sermon" }, { status: 409 })
  }
  let video
  try {
    video = (await fetchVideoDetails([videoId])).get(videoId)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "YouTube request failed" }, { status: 502 })
  }
  if (!video) return NextResponse.json({ error: "The video is no longer on YouTube" }, { status: 410 })
  const sermon = await addPendingSermon(video, row.channelId, { language: "other", preacher: null, topics: [], reason: "Added by an admin" })
  return NextResponse.json({ sermonId: sermon.id })
}
