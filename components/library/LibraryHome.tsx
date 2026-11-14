"use client"

import Link from "next/link"
import { ArrowRight, BookOpenText, Search } from "lucide-react"
import type { LibraryHome as Home } from "@/lib/library-shelves"
import { useTr } from "@/components/home/shared"
import BookCover from "./BookCover"
import ShelfRow from "./ShelfRow"

/** The Books front page, as a library: search, where you left off, then shelves. */
export default function LibraryHome({ home, bookHref }: { home: Home; bookHref: string }) {
  const { tr } = useTr()
  const href = (slug: string) => `${bookHref}/${encodeURIComponent(slug)}`
  const fathers = home.shelves.find(s => s.key === "fathers")
  const fan = (fathers?.books ?? home.shelves[0]?.books ?? []).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#f7f3ec]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200/70 bg-gradient-to-b from-[#efe7da] to-[#f7f3ec]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-800/80">{tr("ቤተ መጻሕፍት", "The library")}</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-stone-900 sm:text-5xl">
              {tr("የእምነትን መጻሕፍት በዕረፍት ያንብቡ", "Books of the faith, to read slowly")}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-stone-600">
              {tr(
                `ከቤተ ክርስቲያን አበው እስከ ዘመናችን መምህራን — ${home.total} መጻሕፍት በአማርኛ፣ በግዕዝና በእንግሊዝኛ።`,
                `From the early Church Fathers to today's teachers: ${home.total} books in Amharic, Ge'ez and English.`,
              )}
            </p>
            <form action="/books" className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-blue-400">
              <Search className="ml-3 h-5 w-5 flex-shrink-0 text-stone-400" />
              <input
                name="search"
                placeholder={tr("መጽሐፍ ይፈልጉ…", "Search for a book…")}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[15px] text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              <button className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 cursor-pointer">
                {tr("ፈልግ", "Search")}
              </button>
            </form>
          </div>

          {/* Three covers, fanned like books set on a table. */}
          {fan.length === 3 && (
            <div className="relative mx-auto hidden h-72 w-80 lg:block" aria-hidden="true">
              {fan.map((b, i) => (
                <div
                  key={b.slug}
                  className="absolute top-4 w-40"
                  style={{ left: `${i * 72}px`, transform: `rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -10 : 8}px)`, zIndex: i === 1 ? 3 : 2 - Math.abs(i - 1) }}
                >
                  <BookCover name={b.name} image={b.image} priority />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Where you left off */}
      {home.resume && (
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-10">
          <Link
            href={`${href(home.resume.slug)}/read?ch=${home.resume.chapter}`}
            className="group flex items-center gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition-shadow hover:shadow-md sm:p-5"
          >
            <div className="w-14 flex-shrink-0 sm:w-16"><BookCover name={home.resume.name} image={home.resume.image} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{tr("ማንበብዎን ይቀጥሉ", "Continue reading")}</p>
              <p className="mt-1 truncate font-serif text-lg font-semibold text-stone-900">{home.resume.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.round((home.resume.chapter / home.resume.chapters) * 100)}%` }} />
                </div>
                <span className="text-xs text-stone-500 tabular-nums">
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
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-4 rounded-2xl bg-stone-900 px-6 py-6 text-stone-100 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="font-serif text-lg font-semibold">
                {tr(`${home.online} መጻሕፍት በድረ ገጹ ላይ ይነበባሉ`, `${home.online} books you can read right here`)}
              </p>
              <p className="mt-1 text-sm text-stone-400">
                {tr(
                  "የቤተ ክርስቲያን አበው ጽሑፎች — ምዕራፍ በምዕራፍ፣ ከማስታወሻና ከንባብ ዕቅድ ጋር።",
                  "The writings of the Church Fathers, chapter by chapter, with notes and a reading plan.",
                )}
              </p>
            </div>
            <Link href={fathers.href ?? "/books/preview"} className="inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-stone-100 sm:self-center">
              {tr("አበውን ያስሱ", "Browse the Fathers")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Shelves */}
      <div className="mx-auto max-w-7xl space-y-6 py-10 sm:space-y-8">
        {home.shelves.map(s => <ShelfRow key={s.key} shelf={s} bookHref={href} />)}
      </div>
    </div>
  )
}
