import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// A work's chapters in English (public domain), for scripts/fathers/translate.mjs.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const work = await prisma.cfWork.findUnique({
    where: { slug },
    select: {
      slug: true, title: true, author: true,
      sections: { orderBy: { position: "asc" }, select: { position: true, title: true, body: true } },
    },
  })
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(work, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  })
}
