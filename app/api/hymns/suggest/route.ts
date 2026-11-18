import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { extractVideoId } from "@/lib/youtube"
import { suggestHymn } from "@/lib/video-suggest"

// Suggestions for the Submit form from the pasted video. Signed-in members
// only, so the YouTube and Gemini allowances are not open to everyone.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  const videoId = typeof body?.video === "string" ? extractVideoId(body.video.trim()) : null
  if (!videoId) return NextResponse.json({ error: "Not a YouTube link" }, { status: 400 })
  try {
    const s = await suggestHymn(videoId)
    return s ? NextResponse.json(s) : NextResponse.json({ error: "Video not found" }, { status: 404 })
  } catch {
    return NextResponse.json({ error: "Could not read the video" }, { status: 502 })
  }
}
