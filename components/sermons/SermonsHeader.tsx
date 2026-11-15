"use client"

import Link from "next/link"
import { Search, X } from "lucide-react"
import type { TopicInUse } from "@/lib/api/sermons"
import { useTr } from "@/components/home/shared"
import { TOPIC_GROUPS } from "@/lib/sermon-topic-groups"

/** The Sermons front page's header: search, language, and topics to browse. */
export default function SermonsHeader({ total, topics, languages, current }: {
  total: number
  topics: TopicInUse[]
  languages: { id: number; name: string }[]
  current: { search?: string; topic?: string; language?: string; sort?: string }
}) {
  const { am, tr } = useTr()
  // Links keep the other choices and change one.
  const href = (change: Partial<typeof current>) => {
    const p = new URLSearchParams()
    const next = { ...current, ...change }
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
    const q = p.toString()
    return q ? `/sermons?${q}` : "/sermons"
  }
  const topic = topics.find(t => t.slug === current.topic)
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
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{tr("ስብከቶች", "Sermons")}</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {tr(
                `${total} ስብከቶችና ትምህርቶች ከኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መምህራን።`,
                `${total} sermons and teachings from Ethiopian Orthodox Tewahedo preachers.`,
              )}
            </p>
          </div>
          <form action="/sermons" className="flex w-full max-w-xl items-center gap-2 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-400 lg:w-[440px]">
            {current.topic && <input type="hidden" name="topic" value={current.topic} />}
            {current.language && <input type="hidden" name="language" value={current.language} />}
            <Search className="ml-2.5 h-4 w-4 flex-shrink-0 text-slate-400" />
            <input
              name="search"
              defaultValue={current.search ?? ""}
              placeholder={tr("ርዕስ፣ ሰባኪ ወይም ቻናል…", "Title, preacher or channel…")}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">{tr("ፈልግ", "Search")}</button>
          </form>
        </div>

        {/* Language */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {[{ id: "", name: tr("ሁሉም ቋንቋ", "All languages") }, ...languages.map(l => ({ id: String(l.id), name: l.name }))].map(l => {
            const on = (current.language ?? "") === l.id
            return (
              <Link
                key={l.id || "all"}
                href={href({ language: l.id || undefined })}
                className={`rounded-full px-3 py-1 text-sm font-medium ${on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {l.name}
              </Link>
            )
          })}
          {current.search && (
            <Link href={href({ search: undefined })} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100">
              “{current.search}” <X className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Topics: one scrolling row on phones; a row per group on wider screens */}
        {topics.length > 0 && (
          <div className="mt-6">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:hidden">
              <li className="flex-shrink-0">{chip(tr("ሁሉም ርዕሶች", "All topics"), href({ topic: undefined }), !topic)}</li>
              {topics.map(t => <li key={t.id} className="flex-shrink-0">{chip(am ? t.nameAm : t.nameEn, href({ topic: t.slug === current.topic ? undefined : t.slug }), t.slug === current.topic, t.count)}</li>)}
            </ul>
            <div className="hidden space-y-2.5 sm:block">
              {TOPIC_GROUPS.filter(g => topics.some(t => t.groupKey === g.key)).map(g => (
                <div key={g.key} className="flex gap-4">
                  <p className="w-36 flex-shrink-0 pt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">{am ? g.am : g.en}</p>
                  <ul className="flex min-w-0 flex-wrap gap-1.5">
                    {topics.filter(t => t.groupKey === g.key).map(t => (
                      <li key={t.id}>{chip(am ? t.nameAm : t.nameEn, href({ topic: t.slug === current.topic ? undefined : t.slug }), t.slug === current.topic, t.count)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
