import { prisma } from "@/lib/prisma"
import { readApprovedAmharic, readWorkText } from "@/lib/library"

// Reading a book from Books online, one chapter at a time, when the book has a
// text in the Church Fathers library (cb_books.cf_work_id, optionally a run of
// that work's chapters — one letter of Ignatius).

export interface ReaderChapter { index: number; title: string; titleAm: string | null }

export interface BookReading {
  book: { slug: string; name: string; author: string }
  work: { slug: string; title: string; titleAm: string | null; author: string; authorAm: string | null }
  range: { from: number; to: number } | null
  chapters: ReaderChapter[]
  current: {
    index: number
    sectionId: number
    title: string
    titleAm: string | null
    paragraphs: string[]
    /** The approved Amharic translation, when there is one. */
    paragraphsAm: string[] | null
  }
  note: string
  signedIn: boolean
}

/** What the book page needs to offer reading online: null if the book has no text. */
export async function bookOnline(slug: string, userId?: number) {
  const book = await prisma.cbBook.findUnique({
    where: { slug },
    select: { name: true, cfWorkId: true, cfFromSection: true, cfToSection: true, cfWork: { select: { slug: true } } },
  })
  if (!book?.cfWorkId || !book.cfWork) return null
  const range = book.cfFromSection && book.cfToSection ? { from: book.cfFromSection, to: book.cfToSection } : null
  const sections = await prisma.cfSection.findMany({
    where: { workId: book.cfWorkId, ...(range ? { position: { gte: range.from, lte: range.to } } : {}) },
    select: { position: true, words: true },
    orderBy: { position: "asc" },
  })
  const progress = userId
    ? await prisma.cfReadingProgress.findUnique({ where: { userId_workId: { userId, workId: book.cfWorkId } }, select: { position: true } })
    : null
  const continueIndex = progress ? sections.findIndex(s => s.position === progress.position) + 1 : 0
  return {
    chapters: sections.length,
    words: sections.reduce((s, x) => s + x.words, 0),
    continueAt: continueIndex > 1 ? continueIndex : null,
    plan: { slug: book.cfWork.slug, title: book.name.replace(/\s+/g, " ").trim(), ...(range ? { range } : {}) },
  }
}

/**
 * One chapter of a book. `requested` is the chapter's number within the book
 * (1-based); without it, where the reader stopped, or the first chapter.
 */
export async function getBookReading(slug: string, userId: number | undefined, requested?: number): Promise<BookReading | null> {
  const book = await prisma.cbBook.findUnique({
    where: { slug },
    select: {
      slug: true, name: true, author: true, cfFromSection: true, cfToSection: true,
      cfWork: { select: { id: true, slug: true, title: true, titleAm: true, author: true, authorAm: true } },
    },
  })
  if (!book?.cfWork) return null
  const work = book.cfWork
  const range = book.cfFromSection && book.cfToSection ? { from: book.cfFromSection, to: book.cfToSection } : null

  const sections = await prisma.cfSection.findMany({
    where: { workId: work.id, ...(range ? { position: { gte: range.from, lte: range.to } } : {}) },
    select: { id: true, position: true, title: true },
    orderBy: { position: "asc" },
  })
  if (sections.length === 0) return null

  let index = requested && requested >= 1 && requested <= sections.length ? requested : 0
  if (!index && userId) {
    const progress = await prisma.cfReadingProgress.findUnique({
      where: { userId_workId: { userId, workId: work.id } },
      select: { position: true },
    })
    index = progress ? sections.findIndex(s => s.position === progress.position) + 1 : 0
  }
  if (!index) index = 1

  // A book that is one part of a work (one letter of Ignatius) has every
  // chapter titled "To the Ephesians · …"; inside that book the prefix says
  // nothing, so it goes.
  const prefix = sections[0].title.includes(" · ") ? sections[0].title.split(" · ")[0] + " · " : null
  const plain = (t: string) => (prefix && sections.every(s => s.title.startsWith(prefix)) ? t.slice(prefix.length) : t)

  const cur = sections[index - 1]
  const [text, amharic, note] = await Promise.all([
    readWorkText(work.slug),
    readApprovedAmharic(work.slug),
    userId ? prisma.cfSectionNote.findUnique({ where: { userId_sectionId: { userId, sectionId: cur.id } }, select: { note: true } }) : null,
  ])
  const am = amharic.get(cur.position)

  return {
    book: { slug: book.slug, name: book.name.replace(/\s+/g, " ").trim(), author: book.author },
    work: { slug: work.slug, title: work.title, titleAm: work.titleAm, author: work.author, authorAm: work.authorAm },
    range,
    chapters: sections.map((s, i) => ({ index: i + 1, title: plain(s.title), titleAm: amharic.get(s.position)?.title ?? null })),
    current: {
      index,
      sectionId: cur.id,
      title: plain(cur.title),
      titleAm: am?.title ?? null,
      paragraphs: text.get(cur.position) ?? [],
      paragraphsAm: am?.paragraphs ?? null,
    },
    note: note?.note ?? "",
    signedIn: !!userId,
  }
}

/** Remember the chapter a member is on, for "continue where you stopped". */
export async function saveReadingProgress(userId: number, workSlug: string, chapterIndex: number, range: { from: number; to: number } | null) {
  const work = await prisma.cfWork.findUnique({ where: { slug: workSlug }, select: { id: true } })
  if (!work) return
  const section = await prisma.cfSection.findFirst({
    where: { workId: work.id, ...(range ? { position: { gte: range.from, lte: range.to } } : {}) },
    orderBy: { position: "asc" },
    skip: chapterIndex - 1,
    select: { position: true },
  })
  if (!section) return
  await prisma.cfReadingProgress.upsert({
    where: { userId_workId: { userId, workId: work.id } },
    create: { userId, workId: work.id, position: section.position },
    update: { position: section.position },
  })
}
