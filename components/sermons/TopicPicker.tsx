"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { TOPIC_GROUPS } from "@/lib/sermon-topic-groups"
import { useTr } from "@/components/home/shared"

export interface PickerTopic { id: number; slug: string; groupKey: string; nameAm: string; nameEn: string }

/**
 * Choose up to `max` topics from one field: the chosen ones show as chips, and
 * the list opens below with a search box and the topics under their groups.
 */
export default function TopicPicker({ topics, value, onChange, max = 3 }: {
  topics: PickerTopic[]
  value: number[]
  onChange: (ids: number[]) => void
  max?: number
}) {
  const { am, tr } = useTr()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const box = useRef<HTMLDivElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const name = (t: PickerTopic) => (am ? t.nameAm : t.nameEn)

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    search.current?.focus()
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [open])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return needle ? topics.filter(t => t.nameEn.toLowerCase().includes(needle) || t.nameAm.includes(q.trim())) : topics
  }, [q, topics])
  const byId = new Map(topics.map(t => [t.id, t]))
  const full = value.length >= max

  function toggle(id: number) {
    if (value.includes(id)) onChange(value.filter(x => x !== id))
    else if (!full) {
      onChange([...value, id])
      if (value.length + 1 >= max) setOpen(false)
    }
  }

  return (
    <div ref={box} className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o) } }}
        className={`flex min-h-11 w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 ring-1 transition-shadow ${open ? "ring-2 ring-blue-400" : "ring-slate-200 hover:ring-slate-300"}`}
      >
        {value.length === 0 && <span className="px-1 text-sm text-slate-400">{tr("ርዕሰ ጉዳይ ይምረጡ", "Choose topics")}</span>}
        {value.map(id => byId.get(id)).filter(Boolean).map(t => (
          <span key={t!.id} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 py-1 pl-2.5 pr-1 text-[13px] font-medium text-blue-800">
            {name(t!)}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(value.filter(x => x !== t!.id)) }}
              className="rounded p-0.5 hover:bg-blue-100 cursor-pointer"
              aria-label={tr("አስወግድ", "Remove")}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <ChevronDown className={`ml-auto h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3">
            <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <input
              ref={search}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={tr("ፈልግ…", "Search topics…")}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <span className="text-xs text-slate-400 tabular-nums">{value.length}/{max}</span>
          </div>
          <div className="max-h-72 overflow-y-auto py-1.5">
            {TOPIC_GROUPS.map(g => {
              const items = shown.filter(t => t.groupKey === g.key)
              if (!items.length) return null
              return (
                <div key={g.key}>
                  <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{am ? g.am : g.en}</p>
                  {items.map(t => {
                    const on = value.includes(t.id)
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggle(t.id)}
                        disabled={!on && full}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <span>{name(t)} <span className="text-slate-400">· {am ? t.nameEn : t.nameAm}</span></span>
                        {on && <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
            {shown.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400">{tr("ምንም አልተገኘም", "No topic matches")}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
