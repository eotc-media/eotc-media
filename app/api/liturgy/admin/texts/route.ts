import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasLiturgyAdminAccess } from "@/lib/auth-helpers"

// GET: List all liturgical texts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasLiturgyAdminAccess(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    // The admin table paginates in the browser, so it asks for the whole list
    // and needs to get it: a fixed window meant a newly added text landed
    // outside it and looked like it had not saved at all. Omitting `limit`
    // returns everything; passing one still pages.
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? parseInt(limitParam) : null
    const search = searchParams.get("search") || ""
    const sectionId = searchParams.get("sectionId")
    const roleId = searchParams.get("roleId")
    const sortBy = searchParams.get("sortBy") || "orderIndex"
    const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc"

    const skip = limit ? (page - 1) * limit : 0

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { textGeez: { contains: search, mode: "insensitive" } },
        { textAmharic: { contains: search, mode: "insensitive" } },
        { textEnglishTranslation: { contains: search, mode: "insensitive" } },
      ]
    }

    if (sectionId) {
      where.sectionId = parseInt(sectionId)
    }

    if (roleId) {
      where.roleId = parseInt(roleId)
    }

    const [texts, total] = await Promise.all([
      prisma.ltLiturgicalText.findMany({
        where,
        skip,
        ...(limit ? { take: limit } : {}),
        orderBy: { [sortBy]: sortOrder },
        // The table shows an order index, section, role, a preview of the
        // English translation, the remark and whether audio exists. It never
        // shows the Ge'ez, Amharic or transliteration bodies, and the edit page
        // loads its own copy of the row, so those three TEXT columns stay here.
        select: {
          id: true,
          sectionId: true,
          roleId: true,
          orderIndex: true,
          textEnglishTranslation: true,
          remark: true,
          audioGeezFilePath: true,
          audioEzilFilePath: true,
          audioArarayFilePath: true,
          createdAt: true,
          updatedAt: true,
          section: { select: { id: true, nameEnglish: true } },
          role: { select: { id: true, roleKey: true, nameEnglish: true } },
        },
      }),
      prisma.ltLiturgicalText.count({ where }),
    ])

    return NextResponse.json({
      texts,
      total,
      page,
      limit,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    })
  } catch (error) {
    console.error("Error fetching texts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create new liturgical text
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasLiturgyAdminAccess(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      sectionId,
      roleId,
      orderIndex,
      textGeez,
      textAmharic,
      textEnglishTransliteration,
      textEnglishTranslation,
      remark,
      audioGeezFilePath,
      audioEzilFilePath,
      audioArarayFilePath,
    } = body

    // Validation
    if (!sectionId || !roleId) {
      return NextResponse.json(
        { error: "sectionId and roleId are required" },
        { status: 400 }
      )
    }

    if (!textGeez || !textAmharic || !textEnglishTransliteration || !textEnglishTranslation) {
      return NextResponse.json(
        { error: "All text fields are required" },
        { status: 400 }
      )
    }

    // Verify section exists
    const section = await prisma.ltSection.findUnique({
      where: { id: sectionId },
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 400 })
    }

    // Verify role exists
    const role = await prisma.ltRole.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 400 })
    }

    const text = await prisma.ltLiturgicalText.create({
      data: {
        sectionId,
        roleId,
        orderIndex: orderIndex || 0,
        textGeez,
        textAmharic,
        textEnglishTransliteration,
        textEnglishTranslation,
        remark: remark || null,
        audioGeezFilePath: audioGeezFilePath || null,
        audioEzilFilePath: audioEzilFilePath || null,
        audioArarayFilePath: audioArarayFilePath || null,
      },
      include: {
        section: {
          select: {
            id: true,
            nameEnglish: true,
          },
        },
        role: {
          select: {
            id: true,
            nameEnglish: true,
          },
        },
      },
    })

    return NextResponse.json({ text }, { status: 201 })
  } catch (error) {
    console.error("Error creating text:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
