"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpenText, CalendarCheck, Download, Heart, MessageSquare } from "lucide-react"
import type { LibraryBook } from "@/lib/library-shelves"
import { bookFileUrl, bookImageUrl } from "@/lib/book-assets"
import PlanBuilder from "@/components/home/PlanBuilder"
import { useTr, localDateToday } from "@/components/home/shared"
import BookCover from "./BookCover"
import ShelfRow from "./ShelfRow"

/** A book's page: the cover large, one clear way in, then what is inside. */
export default function LibraryBookPage({ book, signedIn, home, liveHref }: {
  book: LibraryBook
  signedIn: boolean
  /** Where "back to the library" and other books' links lead. */
  home: string
  /** The book's current page, for likes and comments until they move here. */
  liveHref: string
}) {
  const { tr } = useTr()
  const [planFrom, setPlanFrom] = useState<string | null>(null)
  const readHref = `/books/${encodeURIComponent(book.slug)}/read${book.continueAt ? `?ch=${book.continueAt}` : ""}`

  return (
    <div className="min-h-screen bg-[#f7f3ec]">
      {/* Hero, lit by the cover's own colours */}
      <section className="relative isolate overflow-hidden">
        {book.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bookImageUrl(book.image)} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-40 blur-3xl saturate-150" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#f7f3ec]/40 via-[#f7f3ec]/70 to-[#f7f3ec]" />

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-10">
          <Link href={home} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900">
            <ArrowLeft className="h-4 w-4" /> {tr("ወደ ቤተ መጻሕፍት", "Library")}
          </Link>

          <div className="mt-8 grid gap-8 sm:grid-cols-[200px_1fr] sm:gap-10 lg:grid-cols-[240px_1fr]">
            <div className="mx-auto w-44 sm:mx-0 sm:w-full">
              <BookCover name={book.name} image={book.image} priority className="shadow-[0_2px_4px_rgba(0,0,0,0.15),0_24px_48px_-16px_rgba(60,40,20,0.55)]" />
            </div>

            <div className="min-w-0 self-center">
              {book.categories.length > 0 && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800/80">{book.categories.join(" · ")}</p>
              )}
              <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">{book.name}</h1>
              <p className="mt-2 text-lg text-stone-600">{book.author}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                {book.languages.length > 0 && <span>{book.languages.join(", ")}</span>}
                {book.contents && <span>{tr(`${book.contents.length} ምዕራፎች · ~${book.minutes} ደቂቃ`, `${book.contents.length} chapters · about ${book.minutes} min`)}</span>}
                <Link href={liveHref} className="inline-flex items-center gap-1 hover:text-stone-800"><Heart className="h-3.5 w-3.5" /> {book.likes}</Link>
                {book.comments > 0 && <Link href={`${liveHref}#comments`} className="inline-flex items-center gap-1 hover:text-stone-800"><MessageSquare className="h-3.5 w-3.5" /> {book.comments}</Link>}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {book.contents ? (
                  <>
                    <Link href={readHref} className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800">
                      <BookOpenText className="h-4 w-4" />
                      {book.continueAt ? tr(`ቀጥል · ምዕራፍ ${book.continueAt}`, `Continue · Chapter ${book.continueAt}`) : tr("ማንበብ ይጀምሩ", "Start reading")}
                    </Link>
                    <button onClick={() => setPlanFrom(localDateToday())} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50 cursor-pointer">
                      <CalendarCheck className="h-4 w-4" /> {tr("በዕቅድ ያንብቡ", "Read with a plan")}
                    </button>
                  </>
                ) : (
                  <a href={bookFileUrl(book.file)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800">
                    <BookOpenText className="h-4 w-4" /> {tr("ያንብቡ", "Read")}
                  </a>
                )}
                <a href={bookFileUrl(book.file)} download className="inline-flex items-center gap-1.5 px-2 py-3 text-sm font-medium text-stone-500 hover:text-stone-800">
                  <Download className="h-4 w-4" /> PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {book.description && (
            <section>
              <h2 className="font-serif text-xl font-semibold text-stone-900">{tr("ስለ መጽሐፉ", "About this book")}</h2>
              <p className="mt-3 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-stone-700">{book.description}</p>
            </section>
          )}
          {book.contents && (
            <section className={book.description ? "" : "lg:col-span-2"}>
              <h2 className="font-serif text-xl font-semibold text-stone-900">{tr("ማውጫ", "Contents")}</h2>
              <ol className="mt-3 max-h-96 divide-y divide-stone-200/70 overflow-y-auto rounded-2xl bg-white ring-1 ring-stone-200">
                {book.contents.map(c => (
                  <li key={c.index}>
                    <Link href={`/books/${encodeURIComponent(book.slug)}/read?ch=${c.index}`} className="flex gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-blue-800">
                      <span className="w-6 flex-shrink-0 text-right text-xs font-semibold text-stone-400 tabular-nums">{c.index}</span>
                      <span className="min-w-0">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      {book.moreByAuthor.length > 0 && (
        <div className="mx-auto max-w-7xl py-8">
          <ShelfRow
            shelf={{ key: "author", am: `ሌሎች መጻሕፍት በ${book.author}`, en: `More by ${book.author}`, books: book.moreByAuthor }}
            bookHref={slug => `${home}/${encodeURIComponent(slug)}`}
          />
        </div>
      )}

      {book.plan && planFrom && (
        <PlanBuilder open onClose={() => setPlanFrom(null)} today={planFrom} signedIn={signedIn} initialWork={book.plan} />
      )}
    </div>
  )
}
