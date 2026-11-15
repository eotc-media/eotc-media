import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { hasSermonAdminAccess } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { MAX_TOPICS, setSermonTopics } from "@/lib/sermon-topics"

// Set one sermon's topics (and approve them). { topicIds: number[] }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ sermonId: string }> }) {
  const session = await auth()
  if (!hasSermonAdminAccess(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const sermonId = Number((await params).sermonId)
  const body = await req.json().catch(() => null)
  const ids: number[] = Array.isArray(body?.topicIds) ? body.topicIds.filter((x: unknown) => Number.isInteger(x)) : []
  if (ids.length < 1 || ids.length > MAX_TOPICS) return NextResponse.json({ error: `Choose 1 to ${MAX_TOPICS} topics` }, { status: 400 })
  const [sermon, known] = await Promise.all([
    prisma.smSermon.findUnique({ where: { id: sermonId }, select: { id: true } }),
    prisma.smTopic.count({ where: { id: { in: ids } } }),
  ])
  if (!sermon) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (known !== new Set(ids).size) return NextResponse.json({ error: "Unknown topic" }, { status: 400 })
  await setSermonTopics(sermonId, ids)
  return NextResponse.json({ ok: true })
}
