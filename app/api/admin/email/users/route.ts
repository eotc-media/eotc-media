import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasMainAdminAccess } from "@/lib/auth-helpers"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!hasMainAdminAccess(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()

  const where = {
    emailOptOut: false,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {}),
  }

  // `users` is capped for the search dropdown, but `total` is the real number of
  // eligible recipients — the send goes to all of them, so the UI must not
  // report the truncated list length.
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total })
}
