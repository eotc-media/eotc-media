import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readWorkText } from "@/lib/library"

// A work's chapters in English (public domain), for scripts/fathers/translate.mjs:
// titles from the index, text from R2.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const work = await prisma.cfWork.findUnique({
    where: { slug },
    select: {
      slug: true, title: true, author: true,
      sections: { orderBy: { position: "asc" }, select: { position: true, title: true } },
    },
  })
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const text = await readWorkText(slug)
  return NextResponse.json(
    { ...work, sections: work.sections.map(s => ({ ...s, body: (text.get(s.position) ?? []).join("\n\n") })) },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  )
}
