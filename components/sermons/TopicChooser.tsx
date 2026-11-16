"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { TOPIC_GROUPS } from "@/lib/sermon-topic-groups"
import type { PickerTopic } from "./TopicPicker"

/**
 * Pick up to `max` topics quickly: the groups as small tabs, the open group's
 * topics as tags to tap. Only one group's topics show at a time.
 */
export default function TopicChooser({ topics, value, onChange, am, max = 3 }: {
  topics: PickerTopic[]
  value: number[]
  onChange: (ids: number[]) => void
  am: boolean
  max?: number
}) {
  const [group, setGroup] = useState<string>(TOPIC_GROUPS[0].key)
  const name = (t: PickerTopic) => (am ? t.nameAm : t.nameEn)
  const chosen = value.map(id => topics.find(t => t.id === id)).filter((t): t is PickerTopic => !!t)
  const full = value.length >= max
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter(x => x !== id) : full ? value : [...value, id])

  return (
    <div className="rounded-xl ring-1 ring-slate-200">
      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 p-2.5">
          {chosen.map(t => (
            <span key={t.id} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 py-1 pl-2.5 pr-1 text-[13px] font-medium text-white">
              {name(t)}
              <button type="button" onClick={() => toggle(t.id)} className="rounded p-0.5 hover:bg-blue-500 cursor-pointer" aria-label="Remove">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2 [scrollbar-width:none]">
        {TOPIC_GROUPS.map(g => (
          <button
            type="button"
            key={g.key}
            onClick={() => setGroup(g.key)}
            className={`-mb-px flex-shrink-0 border-b-2 px-2.5 pb-2 text-[13px] font-medium cursor-pointer ${
              group === g.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {am ? g.am : g.en}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 p-2.5">
        {topics.filter(t => t.groupKey === group).map(t => {
          const on = value.includes(t.id)
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => toggle(t.id)}
              disabled={!on && full}
              aria-pressed={on}
              className={`rounded-full px-3 py-1 text-[13px] font-medium ring-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                on ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
              }`}
            >
              {name(t)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
