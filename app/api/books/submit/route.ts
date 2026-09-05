import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { putObject } from '@/lib/storage'

function generateSlug(name: string): string {
  return name.trim().replace(/\s+/g, '-').replace(/[^\w\u1200-\u137F-]/g, '').slice(0, 120) + '-' + Date.now().toString(36)
}

// Covers are displayed at most a few hundred pixels wide, but people upload
// whatever their phone or scanner produced — often several megabytes. Every one
// of those bytes is then served on every book listing. Re-encoding to WebP at
// 600px wide brings a typical cover under 40 KB with no visible loss.
const COVER_MAX_WIDTH = 600

async function compressCover(buffer: Buffer): Promise<{ buffer: Uint8Array; ext: string; type: string }> {
  const out = await sharp(buffer)
    .rotate() // honour EXIF orientation, which stripping metadata would otherwise discard
    .resize({ width: COVER_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  return { buffer: out, ext: 'webp', type: 'image/webp' }
}

// dir is the R2 key prefix ("files" for PDFs, "images" for covers). Returns the
// stored filename; the matching serve route reads books/<dir>/<filename>.
async function saveFile(file: File, dir: string): Promise<string> {
  const original = Buffer.from(await file.arrayBuffer())

  let buffer: Uint8Array = original
  let ext = file.name.split('.').pop() ?? 'bin'
  let type = file.type || 'application/octet-stream'

  if (dir === 'images') {
    try {
      ;({ buffer, ext, type } = await compressCover(original))
    } catch {
      // An unreadable or exotic image still gets stored as uploaded — a book
      // submission is not worth losing over a cover sharp could not decode.
      console.error('[books/submit] cover compression failed; storing original')
    }
  }

  const filename = `book_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}.${ext}`
  await putObject(`books/${dir}/${filename}`, buffer, type)
  return filename
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const name = formData.get('name') as string
  const author = formData.get('author') as string
  const description = formData.get('description') as string | null
  const languageIds = JSON.parse(formData.get('languageIds') as string ?? '[]') as number[]
  const categoryIds = JSON.parse(formData.get('categoryIds') as string ?? '[]') as number[]
  const subCategoryIds = JSON.parse(formData.get('subCategoryIds') as string ?? '[]') as number[]
  const fileField = formData.get('file') as File | null
  const imageField = formData.get('image') as File | null

  if (!name?.trim()) return NextResponse.json({ error: 'Book name is required' }, { status: 400 })
  if (!author?.trim()) return NextResponse.json({ error: 'Author is required' }, { status: 400 })
  if (!fileField || fileField.size === 0) return NextResponse.json({ error: 'PDF file is required' }, { status: 400 })
  if (!imageField || imageField.size === 0) return NextResponse.json({ error: 'Cover image is required' }, { status: 400 })
  if (languageIds.length === 0) return NextResponse.json({ error: 'At least one language is required' }, { status: 400 })
  if (categoryIds.length === 0) return NextResponse.json({ error: 'At least one category is required' }, { status: 400 })
  if (subCategoryIds.length === 0) return NextResponse.json({ error: 'At least one sub-category is required' }, { status: 400 })

  const pendingStatus = await prisma.cbApprovalStatus.findFirst({ where: { name: 'Submitted' } })
  if (!pendingStatus) return NextResponse.json({ error: 'System configuration incomplete' }, { status: 500 })

  const [fileFilename, imageFilename] = await Promise.all([
    saveFile(fileField, 'files'),
    saveFile(imageField, 'images'),
  ])

  const book = await prisma.cbBook.create({
    data: {
      userId: parseInt(session.user.id),
      approvalStatusId: pendingStatus.id,
      name: name.trim(),
      slug: generateSlug(name),
      author: author.trim(),
      description: description?.trim() || null,
      file: fileFilename,
      image: imageFilename,
      updatedAt: new Date(),
    },
  })

  if (languageIds.length) {
    await prisma.cbBookLanguage.createMany({ data: languageIds.map(lid => ({ bookId: book.id, languageId: lid, updatedAt: new Date() })) })
  }
  if (categoryIds.length) {
    await prisma.cbBookCategory.createMany({ data: categoryIds.map(cid => ({ bookId: book.id, categoryId: cid, updatedAt: new Date() })) })
  }
  if (subCategoryIds.length) {
    await prisma.cbBookSubCategory.createMany({ data: subCategoryIds.map(sid => ({ bookId: book.id, subCategoryId: sid, updatedAt: new Date() })) })
  }

  return NextResponse.json({ success: true, slug: book.slug }, { status: 201 })
}
