import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { objectExists } from '@/lib/storage'

// The PDF and cover are uploaded straight to R2 by the browser (see
// /api/books/upload-url). This receives only the filenames those uploads
// produced, so the request stays well under Vercel's 4.5 MB body limit however
// large the book is.

function generateSlug(name: string): string {
  return name.trim().replace(/\s+/g, '-').replace(/[^\wሀ-፿-]/g, '').slice(0, 120) + '-' + Date.now().toString(36)
}

// Filenames come from the client, which was handed them by upload-url. Pin the
// shape so a crafted value cannot point the record at some other object.
const FILENAME = /^book_[a-z0-9]+_[a-z0-9]+\.(pdf|webp|jpg|png)$/

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const name = (body.name ?? '') as string
  const author = (body.author ?? '') as string
  const description = (body.description ?? null) as string | null
  const languageIds = (body.languageIds ?? []) as number[]
  const categoryIds = (body.categoryIds ?? []) as number[]
  const subCategoryIds = (body.subCategoryIds ?? []) as number[]
  const file = (body.file ?? '') as string
  const image = (body.image ?? '') as string

  if (!name?.trim()) return NextResponse.json({ error: 'Book name is required' }, { status: 400 })
  if (!author?.trim()) return NextResponse.json({ error: 'Author is required' }, { status: 400 })
  if (!FILENAME.test(file)) return NextResponse.json({ error: 'PDF file is required' }, { status: 400 })
  if (!FILENAME.test(image)) return NextResponse.json({ error: 'Cover image is required' }, { status: 400 })
  if (languageIds.length === 0) return NextResponse.json({ error: 'At least one language is required' }, { status: 400 })
  if (categoryIds.length === 0) return NextResponse.json({ error: 'At least one category is required' }, { status: 400 })
  if (subCategoryIds.length === 0) return NextResponse.json({ error: 'At least one sub-category is required' }, { status: 400 })

  // A browser upload can fail after the URL was handed out. Without this the
  // book would be created pointing at an object that is not there.
  const [hasFile, hasImage] = await Promise.all([
    objectExists(`books/files/${file}`),
    objectExists(`books/images/${image}`),
  ])
  if (!hasFile || !hasImage) {
    return NextResponse.json({ error: 'Upload did not complete. Please try again.' }, { status: 400 })
  }

  const pendingStatus = await prisma.cbApprovalStatus.findFirst({ where: { name: 'Submitted' } })
  if (!pendingStatus) return NextResponse.json({ error: 'System configuration incomplete' }, { status: 500 })

  const book = await prisma.cbBook.create({
    data: {
      userId: parseInt(session.user.id),
      approvalStatusId: pendingStatus.id,
      name: name.trim(),
      slug: generateSlug(name),
      author: author.trim(),
      description: description?.trim() || null,
      file,
      image,
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
