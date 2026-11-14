"use client"

import Link from "next/link"
import { ArrowRight, BookOpenText, Search } from "lucide-react"
import type { LibraryHome as Home } from "@/lib/library-shelves"
import { useTr } from "@/components/home/shared"
import BookCover from "./BookCover"
import ShelfRow from "./ShelfRow"

/** The Books front page, as a library: search, where you left off, then shelves. */
export default function LibraryHome({ home, bookHref }: { home: Home; bookHref: string }) {
  const { am, tr } = useTr()
  const href = (slug: string) => `${bookHref}/${encodeURIComponent(slug)}`
  const fathers = home.shelves.find(s => s.key === "fathers")

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header: title, search, and the shelves to jump to */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-8 lg:px-10">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{tr("መጻሕፍት", "Books")}</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {tr(
                `${home.total} መንፈሳዊ መጻሕፍት በአማርኛ፣ በግዕዝና በእንግሊዝኛ — ከቤተ ክርስቲያን አበው እስከ ዘመናችን መምህራን።`,
                `${home.total} spiritual books in Amharic, Ge'ez and English, from the Church Fathers to today's teachers.`,
              )}
            </p>
            <form action="/books" className="mt-5 flex max-w-xl items-center gap-2 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400">
              <Search className="ml-2.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <input
                name="search"
                placeholder={tr("መጽሐፍ ይፈልጉ…", "Search for a book…")}
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
                {tr("ፈልግ", "Search")}
              </button>
            </form>
          </div>

          {/* Browse by shelf: the library's map, one tap from each section.
              A panel beside the title on wide screens; a row of chips on phones. */}
          <nav aria-label={tr("ክፍሎች", "Sections")} className="min-w-0">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:hidden">
              {home.shelves.map(s => (
                <li key={s.key} className="flex-shrink-0">
                  <a href={`#shelf-${s.key}`} className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200">
                    {am ? s.am : s.en} <span className="text-xs text-slate-400 tabular-nums">{s.count ?? s.books.length}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="hidden rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:block">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{tr("በክፍል ይመልከቱ", "Browse by")}</p>
              <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {home.shelves.map(s => (
                  <li key={s.key}>
                    <a href={`#shelf-${s.key}`} className="flex items-baseline justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[13px] leading-snug text-slate-700 hover:bg-white hover:text-blue-700">
                      <span>{am ? s.am : s.en}</span>
                      <span className="flex-shrink-0 text-xs text-slate-400 tabular-nums">{s.count ?? s.books.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </section>

      {/* Where you left off */}
      {home.resume && (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-10">
          <Link
            href={`${href(home.resume.slug)}/read?ch=${home.resume.chapter}`}
            className="group flex items-center gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md sm:p-5"
          >
            <div className="w-14 flex-shrink-0 sm:w-16"><BookCover name={home.resume.name} image={home.resume.image} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{tr("ማንበብዎን ይቀጥሉ", "Continue reading")}</p>
              <p className="mt-1 truncate text-base font-semibold text-slate-900">{home.resume.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.round((home.resume.chapter / home.resume.chapters) * 100)}%` }} />
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {tr(`ምዕራፍ ${home.resume.chapter} ከ ${home.resume.chapters}`, `Chapter ${home.resume.chapter} of ${home.resume.chapters}`)}
                </span>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white group-hover:bg-blue-700 sm:inline-flex">
              <BookOpenText className="h-4 w-4" /> {tr("ቀጥል", "Continue")}
            </span>
          </Link>
        </div>
      )}

      {/* Spotlight: what can be read right here */}
      {fathers && (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-10">
          <Link
            href={fathers.href ?? "/books/preview"}
            className="group flex items-center gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-slate-200 transition-shadow hover:shadow-md sm:px-6"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpenText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">
                {tr(`${home.online} መጻሕፍት በድረ ገጹ ላይ ይነበባሉ`, `${home.online} books you can read right here`)}
              </span>
              <span className="block text-sm text-slate-500">
                {tr("የቤተ ክርስቲያን አበው ጽሑፎች — ምዕራፍ በምዕራፍ፣ ከማስታወሻና ከንባብ ዕቅድ ጋር።", "The Church Fathers, chapter by chapter, with notes and reading plans.")}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
          </Link>
        </div>
      )}

      {/* Shelves */}
      <div className="mx-auto max-w-7xl space-y-6 py-10 sm:space-y-8">
        {home.shelves.map(s => <ShelfRow key={s.key} shelf={s} bookHref={href} />)}
      </div>
    </div>
  )
}
