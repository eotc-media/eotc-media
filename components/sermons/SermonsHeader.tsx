"use client"

import Link from "next/link"
import { Search, X } from "lucide-react"
import type { TopicInUse } from "@/lib/api/sermons"
import { useLocale } from "@/lib/i18n/LocaleContext"
import { TOPIC_GROUPS } from "@/lib/sermon-topic-groups"

/** Above the sermons: search, language and topics, as plain as the Hymns page. */
export default function SermonsHeader({ topics, languages, current }: {
  topics: TopicInUse[]
  languages: { id: number; name: string }[]
  current: { search?: string; topic?: string; language?: string; sort?: string }
}) {
  const { t, locale } = useLocale()
  const am = locale === "am"
  // Links keep the other choices and change one.
  const href = (change: Partial<typeof current>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...current, ...change })) if (v) p.set(k, v)
    const q = p.toString()
    return q ? `/sermons?${q}` : "/sermons"
  }
  const chip = (label: string, to: string, on: boolean, count?: number) => (
    <Link
      href={to}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ring-1 ${
        on ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
      }`}
    >
      {label}
      {count !== undefined && <span className={`text-xs tabular-nums ${on ? "text-blue-100" : "text-slate-400"}`}>{count}</span>}
    </Link>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/sermons" className="relative w-full sm:max-w-md">
          {current.topic && <input type="hidden" name="topic" value={current.topic} />}
          {current.language && <input type="hidden" name="language" value={current.language} />}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="search"
            defaultValue={current.search ?? ""}
            placeholder={t("sermon_search_placeholder")}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
          />
          {current.search && (
            <Link href={href({ search: undefined })} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label="Clear">
              <X className="h-4 w-4" />
            </Link>
          )}
        </form>
        <div className="flex flex-wrap gap-1.5">
          {[{ id: "", name: t("filter_all") }, ...languages.map(l => ({ id: String(l.id), name: l.name }))].map(l => (
            <Link
              key={l.id || "all"}
              href={href({ language: l.id || undefined })}
              className={`rounded-full px-3 py-1 text-sm font-medium ${(current.language ?? "") === l.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {l.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Topics: one scrolling row on phones; a row per group on wider screens */}
      {topics.length > 0 && (
        <>
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:hidden">
            <li className="flex-shrink-0">{chip(t("filter_all"), href({ topic: undefined }), !current.topic)}</li>
            {topics.map(x => <li key={x.id} className="flex-shrink-0">{chip(am ? x.nameAm : x.nameEn, href({ topic: x.slug === current.topic ? undefined : x.slug }), x.slug === current.topic, x.count)}</li>)}
          </ul>
          <div className="hidden space-y-2 sm:block">
            {TOPIC_GROUPS.filter(g => topics.some(x => x.groupKey === g.key)).map(g => (
              <div key={g.key} className="flex gap-4">
                <p className="w-32 flex-shrink-0 pt-1.5 text-xs font-medium text-slate-400">{am ? g.am : g.en}</p>
                <ul className="flex min-w-0 flex-wrap gap-1.5">
                  {topics.filter(x => x.groupKey === g.key).map(x => (
                    <li key={x.id}>{chip(am ? x.nameAm : x.nameEn, href({ topic: x.slug === current.topic ? undefined : x.slug }), x.slug === current.topic, x.count)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
