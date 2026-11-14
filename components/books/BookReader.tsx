"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight, NotebookPen } from "lucide-react"
import type { BookReading } from "@/lib/books-reader"
import NoteEditor from "@/components/home/NoteEditor"
import { useTr } from "@/components/home/shared"

/** A book from Books, read online one chapter at a time, with a note beside it. */
export default function BookReader({ reading }: { reading: BookReading }) {
  const { am, tr } = useTr()
  const router = useRouter()
  const [english, setEnglish] = useState(false)
  const { book, current, chapters } = reading
  const total = chapters.length
  const href = (i: number) => `/books/${encodeURIComponent(book.slug)}/read?ch=${i}`

  const amharic = am && current.paragraphsAm !== null && !english
  const paragraphs = amharic && current.paragraphsAm ? current.paragraphsAm : current.paragraphs
  const title = amharic && current.titleAm ? current.titleAm : current.title

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href={`/books/${encodeURIComponent(book.slug)}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {tr("ወደ መጽሐፉ", "Back to the book")}
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            {am ? (reading.work.authorAm ?? reading.work.author) : reading.work.author}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{book.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tr(`ምዕራፍ ${current.index} ከ ${total}`, `Chapter ${current.index} of ${total}`)}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="sr-only">{tr("ምዕራፍ ይምረጡ", "Go to chapter")}</span>
          <select
            value={current.index}
            onChange={e => router.push(href(Number(e.target.value)))}
            className="max-w-[18rem] truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
          >
            {chapters.map(c => (
              <option key={c.index} value={c.index}>
                {c.index}. {(am && c.titleAm) || c.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {am && (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>
                  {current.paragraphsAm
                    ? "ትርጉሙ በ AI የተሠራና የተገመገመ ነው፤ ዋናው የ1885 የእንግሊዝኛ ትርጉም ነው።"
                    : "ይህ ምዕራፍ በእንግሊዝኛ ትርጉም ብቻ ይገኛል።"}
                </span>
                {current.paragraphsAm && (
                  <button onClick={() => setEnglish(e => !e)} className="font-medium text-blue-600 hover:underline cursor-pointer">
                    {english ? "አማርኛውን አሳይ" : "እንግሊዝኛውን አሳይ"}
                  </button>
                )}
              </p>
            )}
            <div className="mt-5 space-y-4 text-[17px] leading-8 text-slate-800">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </article>

          <nav className="mt-6 flex items-center justify-between gap-3">
            {current.index > 1 ? (
              <Link href={href(current.index - 1)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" /> {tr("ቀዳሚ ምዕራፍ", "Previous chapter")}
              </Link>
            ) : <span />}
            {current.index < total ? (
              <Link href={href(current.index + 1)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                {tr("ቀጣይ ምዕራፍ", "Next chapter")} <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-sm font-medium text-emerald-700">{tr("መጽሐፉን ጨርሰዋል።", "You've reached the end of the book.")}</span>
            )}
          </nav>
        </div>

        <aside className="lg:sticky lg:top-24">
          {reading.signedIn ? (
            <NoteEditor url={`/api/fathers/notes/${current.sectionId}`} initial={reading.note} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              <p className="flex items-center gap-2 font-semibold text-slate-900">
                <NotebookPen className="h-4 w-4 text-slate-400" /> {tr("ማስታወሻ", "Notes")}
              </p>
              <p className="mt-2">
                <Link href={`/auth/login?callbackUrl=${encodeURIComponent(href(current.index))}`} className="font-medium text-blue-600 hover:underline">
                  {tr("ይግቡ", "Sign in")}
                </Link>{" "}
                {tr("ማስታወሻ ለመያዝና ያቆሙበትን ለማስታወስ።", "to keep notes and pick up where you stopped.")}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
