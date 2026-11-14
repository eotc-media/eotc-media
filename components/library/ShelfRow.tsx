"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import type { Shelf } from "@/lib/library-shelves"
import { useTr } from "@/components/home/shared"
import BookCover from "./BookCover"

/** One shelf: a title, and its books in a row that scrolls sideways. */
export default function ShelfRow({ shelf, bookHref }: { shelf: Shelf; bookHref: (slug: string) => string }) {
  const { am, tr } = useTr()
  const row = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" })

  return (
    <section id={`shelf-${shelf.key}`} className="group/shelf scroll-mt-20">
      <div className="flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{am ? shelf.am : shelf.en}</h2>
          {(shelf.noteEn || shelf.noteAm) && (
            <p className="mt-0.5 text-sm text-slate-500">{am ? shelf.noteAm : shelf.noteEn}</p>
          )}
        </div>
        {shelf.href && (
          <Link href={shelf.href} className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">
            {tr("ሁሉንም ይመልከቱ", "See all")} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={row}
          className="flex snap-x gap-5 overflow-x-auto scroll-px-4 px-4 pb-6 pt-4 [scrollbar-width:none] sm:gap-6 sm:scroll-px-6 sm:px-6 lg:scroll-px-10 lg:px-10"
        >
          {shelf.books.map(b => (
            <Link key={b.slug} href={bookHref(b.slug)} className="group w-[120px] flex-shrink-0 snap-start sm:w-[140px] lg:w-[150px]">
              <div className="transition-transform duration-300 group-hover:-translate-y-1">
                <BookCover name={b.name} image={b.image} />
              </div>
              <p className="mt-3 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 group-hover:text-blue-800">{b.name}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{b.author}</p>
              {b.online && (
                <span className="mt-1.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {tr("በድረ ገጹ ይነበባል", "Read online")}
                </span>
              )}
            </Link>
          ))}
        </div>
        {/* Arrows for mouse users; on touch the row simply swipes. */}
        {(["left", "right"] as const).map(side => (
          <button
            key={side}
            onClick={() => scroll(side === "left" ? -1 : 1)}
            aria-label={side === "left" ? tr("ወደ ኋላ", "Scroll back") : tr("ወደ ፊት", "Scroll on")}
            className={`absolute top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 opacity-0 shadow-md ring-1 ring-slate-200 transition-opacity hover:text-slate-950 group-hover/shelf:opacity-100 md:flex cursor-pointer ${side === "left" ? "left-3" : "right-3"}`}
          >
            {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        ))}
      </div>
    </section>
  )
}
