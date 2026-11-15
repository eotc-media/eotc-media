"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpenText, CalendarCheck, Download, Heart, MessageSquare } from "lucide-react"
import BookDiscussion from "./BookDiscussion"
import { useSavedPdfPage } from "@/components/books/pdf-progress"
import type { LibraryBook } from "@/lib/library-shelves"
import { bookFileUrl } from "@/lib/book-assets"
import PlanBuilder from "@/components/home/PlanBuilder"
import { useTr, localDateToday } from "@/components/home/shared"
import BookCover from "./BookCover"
import ShelfRow from "./ShelfRow"

/** A book's page: the cover large, one clear way in, then what is inside. */
export default function LibraryBookPage({ book, signedIn }: { book: LibraryBook; signedIn: boolean }) {
  const { tr } = useTr()
  const [planFrom, setPlanFrom] = useState<string | null>(null)
  const [liked, setLiked] = useState(book.hasLiked)
  const [likes, setLikes] = useState(book.likes)
  const home = "/books"

  async function toggleLike() {
    if (!signedIn) { window.location.href = "/auth/login"; return }
    const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}/like`, { method: "POST" }).catch(() => null)
    if (res?.ok) {
      const { liked: now } = await res.json()
      setLiked(now)
      setLikes(n => n + (now ? 1 : -1))
    }
  }
  const readHref = `/books/${encodeURIComponent(book.slug)}/read${book.continueAt ? `?ch=${book.continueAt}` : ""}`
  const pdfPage = useSavedPdfPage(book.slug)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header: the cover, what the book is, and the way in */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-10">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500">
            <Link href={home} className="inline-flex items-center gap-1.5 font-medium hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> {tr("መጻሕፍት", "Books")}
            </Link>
            {book.categories[0] && <><span className="text-slate-300">/</span><span className="truncate">{book.categories[0]}</span></>}
          </nav>

          <div className="mt-8 grid gap-8 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="mx-auto w-40 sm:mx-0 sm:w-full">
              <BookCover name={book.name} image={book.image} priority className="shadow-[0_1px_2px_rgba(15,23,42,0.08),0_20px_40px_-18px_rgba(15,23,42,0.45)]" />
            </div>

            <div className="min-w-0 self-center">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-[28px]">{book.name}</h1>
              <p className="mt-1.5 text-[15px] text-slate-500">{book.author}</p>

              <ul className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                {book.languages.length > 0 && <li className="rounded-full bg-slate-100 px-2.5 py-1">{book.languages.join(", ")}</li>}
                {book.contents && (
                  <li className="rounded-full bg-slate-100 px-2.5 py-1">
                    {tr(`${book.contents.length} ምዕራፎች · ~${book.minutes} ደቂቃ`, `${book.contents.length} chapters · ~${book.minutes} min`)}
                  </li>
                )}
                {book.contents && <li className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{tr("በድረ ገጹ ይነበባል", "Read online")}</li>}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {book.contents ? (
                  <>
                    <Link href={readHref} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                      <BookOpenText className="h-4 w-4" />
                      {book.continueAt ? tr(`ቀጥል · ምዕራፍ ${book.continueAt}`, `Continue · Chapter ${book.continueAt}`) : tr("ማንበብ ይጀምሩ", "Start reading")}
                    </Link>
                    <button onClick={() => setPlanFrom(localDateToday())} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer">
                      <CalendarCheck className="h-4 w-4" /> {tr("በዕቅድ ያንብቡ", "Read with a plan")}
                    </button>
                  </>
                ) : (
                  <Link href={`/books/${encodeURIComponent(book.slug)}/read`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                    <BookOpenText className="h-4 w-4" /> {pdfPage ? tr(`ቀጥል · ገጽ ${pdfPage}`, `Continue · Page ${pdfPage}`) : tr("ያንብቡ", "Read")}
                  </Link>
                )}
                <a href={bookFileUrl(book.file)} download className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800">
                  <Download className="h-4 w-4" /> PDF
                </a>
                <span className="ml-auto flex items-center gap-3 text-sm text-slate-400">
                  <button onClick={toggleLike} aria-pressed={liked} aria-label={tr("ወደድኩት", "Like")} className={`inline-flex items-center gap-1 rounded-lg px-1.5 py-1 cursor-pointer ${liked ? "text-rose-600" : "hover:text-slate-700"}`}>
                    <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {likes}
                  </button>
                  {book.comments.length > 0 && <a href="#comments" className="inline-flex items-center gap-1 hover:text-slate-700"><MessageSquare className="h-4 w-4" /> {book.comments.length}</a>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(book.description || book.contents) && (
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-10">
          <div className={`grid items-start gap-6 ${book.description && book.contents ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
            {book.description && (
              <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">{tr("ስለ መጽሐፉ", "About this book")}</h2>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-600">{book.description}</p>
              </section>
            )}
            {book.contents && (
              <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                <h2 className="flex items-center justify-between border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">
                  {tr("ማውጫ", "Contents")}
                  <span className="text-xs font-medium text-slate-400">{tr(`${book.contents.length} ምዕራፎች`, `${book.contents.length} chapters`)}</span>
                </h2>
                <ol className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
                  {book.contents.map(c => (
                    <li key={c.index}>
                      <Link
                        href={`/books/${encodeURIComponent(book.slug)}/read?ch=${c.index}`}
                        className={`flex gap-3 px-5 py-2.5 text-sm hover:bg-slate-50 hover:text-blue-700 ${c.index === book.continueAt ? "bg-blue-50/60 text-blue-800" : "text-slate-700"}`}
                      >
                        <span className="w-6 flex-shrink-0 text-right text-xs font-semibold text-slate-400 tabular-nums">{c.index}</span>
                        <span className="min-w-0">{c.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </div>
      )}

      <div id="comments" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-6 sm:px-6 lg:px-10">
        <div className={book.description && book.contents ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6" : ""}>
          <BookDiscussion slug={book.slug} initial={book.comments} signedIn={signedIn} />
        </div>
      </div>

      {book.moreByAuthor.length > 0 && (
        <div className="mx-auto max-w-6xl py-10">
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
