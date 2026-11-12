import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fathersAdmin } from "@/lib/fathers-admin"

// Approve every translated chapter of a work at once.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await fathersAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const { slug } = await params
  const r = await prisma.cfSection.updateMany({
    where: { work: { slug }, bodyAm: { not: null }, bodyAmApproved: false },
    data: { bodyAmApproved: true },
  })
  return NextResponse.json({ approved: r.count })
}
