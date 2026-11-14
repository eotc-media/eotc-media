import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fathersAdmin } from "@/lib/fathers-admin"
import { updateWorkAmharic } from "@/lib/library"

// Approve every translated chapter of a work at once.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await fathersAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { slug } = await params
  if (!(await prisma.cfWork.findUnique({ where: { slug }, select: { id: true } }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  let approved = 0
  await updateWorkAmharic(slug, chapters => {
    for (const c of chapters.values()) if (!c.approved) { c.approved = true; approved++ }
  })
  return NextResponse.json({ approved })
}
