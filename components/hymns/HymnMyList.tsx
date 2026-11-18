"use client"

import Link from "next/link"
import { ChevronRight, Music, Plus } from "lucide-react"
import { HmHymn } from "@/types/models/hymn"
import Pager from "@/components/ui/Pager"
import { useLocale } from "@/lib/i18n/LocaleContext"

interface HymnMyListProps {
  hymns: HmHymn[]
  total: number
  page: number
  totalPages: number
  baseUrl: string
}

/** The hymns a member has added, newest first, with where each one stands. */
export default function HymnMyList({ hymns, total, page, totalPages, baseUrl }: HymnMyListProps) {
  const { t, locale } = useLocale()
  const am = locale === "am"
  // The status names as before: Accepted, Submitted, Declined.
  const statusClass = (name?: string) =>
    name === "Accepted" ? "bg-emerald-50 text-emerald-700" : name === "Declined" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t("hymn_my_uploads")}</h1>
          <p className="mt-1 text-sm text-slate-500">{total.toLocaleString()} {t(total === 1 ? "hymn_singular" : "hymn_plural")}</p>
        </div>
        <Link href="/hymns/submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> {t("hymn_submit")}
        </Link>
      </div>

      {hymns.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-20 text-center ring-1 ring-slate-200">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Music className="h-6 w-6" /></span>
          <p className="mt-4 font-semibold text-slate-900">{am ? "እስካሁን መዝሙር አላስገቡም" : "No hymns yet"}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {hymns.map(h => {
            const tags = [...(h.categories?.map(c => c.name) ?? []), ...(h.subCategories?.map(s => s.name) ?? [])]
            const status = h.approvalStatus?.name ?? "Submitted"
            return (
              <li key={h.id}>
                <Link href={`/hymns/my-hymns/${h.id}`} prefetch={false} className="group flex items-center gap-4 p-3 hover:bg-slate-50 sm:p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.thumbnailMedium} alt="" className="aspect-video w-28 flex-shrink-0 rounded-lg bg-slate-100 object-cover sm:w-36" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-blue-700">{h.title}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {[h.channel?.title, h.languages?.map(l => l.name).join(", "), new Date(h.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })].filter(Boolean).join(" · ")}
                    </p>
                    {tags.length > 0 && (
                      <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
                        {tags.map(x => <span key={x} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{x}</span>)}
                      </div>
                    )}
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(status)}`}>{status}</span>
                  <ChevronRight className="hidden h-4 w-4 flex-shrink-0 text-slate-300 sm:block" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <Pager page={page} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  )
}
