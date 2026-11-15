"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Shelf } from "@/lib/library-shelves"
import { useTr } from "@/components/home/shared"
import BookCover from "./BookCover"

/** Every book on one shelf. */
export default function ShelfGrid({ shelf, home }: { shelf: Shelf; home: string }) {
  const { am, tr } = useTr()
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <Link href={home} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> {tr("መጻሕፍት", "Books")}
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">{am ? shelf.am : shelf.en}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {(am ? shelf.noteAm : shelf.noteEn) ?? ""}{(shelf.noteAm || shelf.noteEn) ? " · " : ""}{tr(`${shelf.books.length} መጻሕፍት`, `${shelf.books.length} books`)}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {shelf.books.map(b => (
            <Link key={b.slug} href={`${home}/${encodeURIComponent(b.slug)}`} className="group">
              <div className="transition-transform duration-300 group-hover:-translate-y-1"><BookCover name={b.name} image={b.image} /></div>
              <p className="mt-3 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 group-hover:text-blue-800">{b.name}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{b.author}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
