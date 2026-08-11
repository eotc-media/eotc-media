"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import BookCard from "./BookCard"
import { CbBook } from "@/types/models/book"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocale } from "@/lib/i18n/LocaleContext"

interface BookInfiniteGridProps {
  initialBooks: CbBook[]
  initialTotal: number
  initialTotalPages: number
  filters?: Record<string, string | undefined>
  basePath?: string
}

export default function BookInfiniteGrid({
  initialBooks,
  initialTotal,
  initialTotalPages,
  filters = {},
  basePath = "/books",
}: BookInfiniteGridProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const activeSort = searchParams.get("sort") ?? "newest"

  // Sorting lives with the result count, the way hymns and sermons do it,
  // rather than as another dropdown in the filter row.
  function applySort(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    if (value === "newest") params.delete("sort")
    else params.set("sort", value)
    router.push(`${basePath}?${params.toString()}`)
  }

  const [books, setBooks] = useState<CbBook[]>(initialBooks)
  const [page, setPage] = useState(1)
  const [totalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset when filters change
  useEffect(() => {
    setBooks(initialBooks)
    setPage(1)
  }, [initialBooks])

  useEffect(() => {
    if (page === 1) return
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", "24")
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })

    setLoading(true)
    fetch(`/api/books?${params}`)
      .then(r => r.json())
      .then(data => { setBooks(prev => [...prev, ...(data.books ?? [])]) })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && page < totalPages) {
        setPage(p => p + 1)
      }
    }, { rootMargin: "200px" })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loading, page, totalPages])

  if (books.length === 0 && !loading) {
    return <p className="text-sm text-slate-400 py-10 text-center">No books found.</p>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <p className="text-xs text-slate-400">
          {initialTotal.toLocaleString()} book{initialTotal !== 1 ? "s" : ""}
        </p>
        <span className="text-slate-300 text-xs select-none">|</span>
        <Select value={activeSort} onValueChange={applySort}>
          <SelectTrigger className="h-6 text-xs w-auto min-w-0 bg-transparent border-0 shadow-none px-0 focus:ring-0 text-slate-400 cursor-pointer gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sort_newest_first")}</SelectItem>
            <SelectItem value="oldest">{t("sort_oldest_first")}</SelectItem>
            <SelectItem value="popular">{t("sort_most_liked")}</SelectItem>
            <SelectItem value="title">{t("sort_name_az")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
      <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
        {loading && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
      </div>
      <p className="sr-only">{basePath}</p>
    </div>
  )
}
