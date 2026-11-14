import { prisma } from "@/lib/prisma"

// The Books front page as a library: shelves people browse, rather than one
// grid filtered by categories. Shelves are drawn from the existing data —
// authors, and categories grouped by meaning (the data has the same subject
// under English and Amharic names) — without changing it.

export interface ShelfBook {
  slug: string
  name: string
  author: string
  image: string | null
  /** Has a text to read on the site (not only a PDF). */
  online: boolean
}

export interface Shelf {
  key: string
  am: string
  en: string
  noteAm?: string
  noteEn?: string
  /** Its "See all" page; none for a shelf that is only a row (more by an author). */
  href?: string
  books: ShelfBook[]
}

export interface LibraryHome {
  total: number
  online: number
  /** The book a signed-in reader was last reading online, and where. */
  resume: (ShelfBook & { chapter: number; chapters: number }) | null
  shelves: Shelf[]
}

// Subjects, each gathering the category names (in either language) that mean it.
const SUBJECTS: { key: string; am: string; en: string; categories: string[] }[] = [
  { key: "church-order", am: "ሥርዓተ ቤተ ክርስቲያንና ቅዳሴ", en: "Church order & liturgy", categories: ["ሥርዓተ ቤተክርስቲያን", "Liturgy"] },
  { key: "theology", am: "ነገረ መለኮት", en: "Theology & doctrine", categories: ["ነገረ መለኮት", "Dogma", "እቅበተ እምነት"] },
  { key: "spiritual-life", am: "መንፈሳዊ ሕይወት", en: "Spiritual life", categories: ["Spiritual Life", "መንፈሳዊ ህይወት", "Spiritual Service", "አገልግሎት"] },
  { key: "history", am: "ታሪክና ቅዱሳን", en: "History & saints", categories: ["ታሪክ", "History", "ቅዱሳን", "Saints"] },
  { key: "bible", am: "መጽሐፍ ቅዱስ", en: "The Bible", categories: ["Bible", "መጽሃፍ ቅዱስ", "መፅሃፍ ቅዱስ", "መልእክታት"] },
  { key: "questions", am: "ጥያቄና መልስ", en: "Questions & answers", categories: ["Quizzes and Questions"] },
]

// Authors with enough books to be a shelf of their own; their books are not
// repeated on the subject shelves, so each shelf shows something new.
const AUTHORS = [
  { key: "shenouda", am: "ብፁዕ ወቅዱስ ፖፕ ሺኖዳ ሣልሳዊ", en: "H.H. Pope Shenouda III", match: "Shenouda" },
  { key: "malaty", am: "አባ ታድሮስ ያዕቆብ ማላቲ", en: "Fr Tadros Y. Malaty", match: "Malaty", noteAm: "በመጽሐፍ ቅዱስ ቅደም ተከተል", noteEn: "Commentaries, in Bible order" },
]

const SHELF_SIZE = 18

/** Every shelf, in full. */
async function buildShelves() {
  const [books, bibleBooks] = await Promise.all([
    prisma.cbBook.findMany({
      where: { approvalStatus: { name: "Accepted" } },
      select: {
        id: true, slug: true, name: true, author: true, image: true, cfWorkId: true, cfFromSection: true, cfToSection: true,
        categories: { select: { category: { select: { id: true, name: true } } } },
        _count: { select: { likes: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.blBook.findMany({ select: { englishName: true }, orderBy: { id: "asc" } }),
  ])

  const card = (b: (typeof books)[number]): ShelfBook => ({
    slug: b.slug, name: b.name.replace(/\s+/g, " ").trim(), author: b.author, image: b.image, online: b.cfWorkId !== null,
  })

  const shelves: Shelf[] = []
  const online = books.filter(b => b.cfWorkId !== null)
  if (online.length) {
    shelves.push({
      key: "fathers", am: "የቤተ ክርስቲያን አበው", en: "The Church Fathers",
      noteAm: "በድረ ገጹ ላይ ያንብቡ", noteEn: "Read them right here", href: "/books/preview/shelf/fathers",
      books: online.map(card),
    })
  }

  const byAuthor = new Set<number>()
  const authorShelves = AUTHORS.map(a => {
    let list = books.filter(b => b.author.toLowerCase().includes(a.match.toLowerCase()))
    list.forEach(b => byAuthor.add(b.id))
    if (a.key === "malaty") list = bibleOrder(list, bibleBooks.map(x => x.englishName))
    return { key: a.key, am: a.am, en: a.en, noteAm: a.noteAm, noteEn: a.noteEn, href: `/books/preview/shelf/${a.key}`, books: list.map(card) }
  })

  const subjectShelves = SUBJECTS.map(s => {
    const list = books.filter(b => !byAuthor.has(b.id) && b.cfWorkId === null && b.categories.some(c => s.categories.includes(c.category.name)))
    return {
      key: s.key, am: s.am, en: s.en, href: `/books/preview/shelf/${s.key}`,
      // Most liked first: the best place to start on a subject.
      books: list.sort((x, y) => y._count.likes - x._count.likes).map(card),
    }
  })

  // Amharic church order leads (the largest and most local shelf), then the
  // two authors, then the remaining subjects.
  const [order, ...rest] = subjectShelves
  shelves.push(order, ...authorShelves, ...rest)
  return { books, online, card, shelves: shelves.filter(sh => sh.books.length > 0) }
}

export async function getLibraryHome(userId?: number): Promise<LibraryHome> {
  const { books, online, card, shelves } = await buildShelves()

  let resume: LibraryHome["resume"] = null
  if (userId) {
    const last = await prisma.cfReadingProgress.findFirst({ where: { userId }, orderBy: { updatedAt: "desc" }, select: { workId: true, position: true } })
    if (last) {
      const book = online.find(b => b.cfWorkId === last.workId && (!b.cfFromSection || (last.position >= b.cfFromSection && last.position <= (b.cfToSection ?? b.cfFromSection))))
      if (book) {
        const positions = await prisma.cfSection.findMany({
          where: { workId: last.workId, ...(book.cfFromSection ? { position: { gte: book.cfFromSection, lte: book.cfToSection ?? book.cfFromSection } } : {}) },
          select: { position: true }, orderBy: { position: "asc" },
        })
        resume = { ...card(book), chapter: positions.findIndex(p => p.position === last.position) + 1, chapters: positions.length }
      }
    }
  }

  return {
    total: books.length,
    online: online.length,
    resume,
    shelves: shelves.map(s => ({ ...s, books: s.books.slice(0, SHELF_SIZE) })),
  }
}

/** One shelf with all its books, for its "See all" page. */
export async function getShelf(key: string): Promise<Shelf | null> {
  return (await buildShelves()).shelves.find(s => s.key === key) ?? null
}

/** Commentaries in the order of the books they comment on; others after. */
function bibleOrder<T extends { name: string }>(list: T[], englishNames: string[]): T[] {
  // "1 Samuel" → "samuel"; a few spellings found in the titles map too.
  const keys = englishNames.map(n => n.replace(/^\d\s*/, "").toLowerCase().replace("song of solomon", "song of songs"))
  const rank = (title: string) => {
    const t = title.toLowerCase().replace("corintians", "corinthians").replace("the book of revelation", "revelation")
    let best = Infinity
    keys.forEach((k, i) => { if (t.includes(k) && i < best) best = i })
    return best
  }
  return [...list].sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
}

export interface LibraryBook {
  slug: string
  name: string
  author: string
  image: string | null
  description: string | null
  file: string
  languages: string[]
  categories: string[]
  likes: number
  comments: number
  /** For a book with an online text: its chapters, and where to start or continue. */
  contents: { index: number; title: string }[] | null
  continueAt: number | null
  minutes: number | null
  plan: { slug: string; title: string; range?: { from: number; to: number } } | null
  moreByAuthor: ShelfBook[]
}

/** Everything the book page shows. */
export async function getLibraryBook(slug: string, userId?: number): Promise<LibraryBook | null> {
  const b = await prisma.cbBook.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, name: true, author: true, image: true, description: true, file: true,
      cfWorkId: true, cfFromSection: true, cfToSection: true, cfWork: { select: { slug: true } },
      languages: { select: { language: { select: { name: true } } } },
      categories: { select: { category: { select: { name: true } } } },
      _count: { select: { likes: true, comments: true } },
    },
  })
  if (!b) return null
  const name = b.name.replace(/\s+/g, " ").trim()

  let contents: LibraryBook["contents"] = null
  let continueAt: number | null = null
  let words = 0
  if (b.cfWorkId) {
    const range = b.cfFromSection ? { gte: b.cfFromSection, lte: b.cfToSection ?? b.cfFromSection } : undefined
    const sections = await prisma.cfSection.findMany({
      where: { workId: b.cfWorkId, ...(range ? { position: range } : {}) },
      select: { position: true, title: true, words: true },
      orderBy: { position: "asc" },
    })
    // Inside one letter of a larger work, "To the Ephesians · " says nothing.
    const prefix = sections[0]?.title.includes(" · ") ? sections[0].title.split(" · ")[0] + " · " : null
    const strip = (t: string) => (prefix && sections.every(s => s.title.startsWith(prefix)) ? t.slice(prefix.length) : t)
    contents = sections.map((s, i) => ({ index: i + 1, title: strip(s.title) }))
    words = sections.reduce((n, s) => n + s.words, 0)
    if (userId) {
      const p = await prisma.cfReadingProgress.findUnique({ where: { userId_workId: { userId, workId: b.cfWorkId } }, select: { position: true } })
      const i = p ? sections.findIndex(s => s.position === p.position) + 1 : 0
      continueAt = i > 1 ? i : null
    }
  }

  const more = await prisma.cbBook.findMany({
    where: { author: b.author, id: { not: b.id }, approvalStatus: { name: "Accepted" } },
    select: { slug: true, name: true, author: true, image: true, cfWorkId: true },
    orderBy: { id: "asc" },
    take: 18,
  })

  return {
    slug: b.slug, name, author: b.author, image: b.image, description: b.description, file: b.file,
    languages: b.languages.map(l => l.language.name),
    categories: [...new Set(b.categories.map(c => c.category.name))],
    likes: b._count.likes, comments: b._count.comments,
    contents, continueAt,
    minutes: contents ? Math.max(5, Math.round(words / 180 / 5) * 5) : null,
    plan: b.cfWork ? { slug: b.cfWork.slug, title: name, ...(b.cfFromSection ? { range: { from: b.cfFromSection, to: b.cfToSection ?? b.cfFromSection } } : {}) } : null,
    moreByAuthor: more.map(m => ({ slug: m.slug, name: m.name.replace(/\s+/g, " ").trim(), author: m.author, image: m.image, online: m.cfWorkId !== null })),
  }
}
