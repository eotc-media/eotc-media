"use client"

import { useState } from "react"
import { X } from "lucide-react"

export interface ChooserCategory { id: number; name: string; subCategories: { id: number; name: string }[] }

/**
 * A hymn's categories, quickly: the language's categories as tabs, and in each
 * the sub-categories to tap (as many as fit).
 */
export default function HymnCategoryChooser({ categories, value, onChange }: {
  categories: ChooserCategory[]
  value: number[]
  onChange: (subCategoryIds: number[]) => void
}) {
  const [open, setOpen] = useState<number | null>(null)
  const current = categories.find(c => c.id === open) ?? categories[0]
  const chosen = categories.flatMap(c => c.subCategories.filter(s => value.includes(s.id)).map(s => ({ ...s, category: c.name })))

  // Each tap adds or removes one; several in the same category are fine.
  const pick = (subId: number) => onChange(value.includes(subId) ? value.filter(x => x !== subId) : [...value, subId])

  if (!current) return null
  return (
    <div className="rounded-xl ring-1 ring-slate-200">
      {chosen.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 p-2.5">
          {chosen.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 py-1 pl-2.5 pr-1 text-[13px] font-medium text-white">
              {s.name}
              <button type="button" onClick={() => onChange(value.filter(x => x !== s.id))} className="rounded p-0.5 hover:bg-blue-500 cursor-pointer" aria-label="Remove">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2.5 [scrollbar-width:none]">
        {categories.map(c => {
          const has = c.subCategories.some(s => value.includes(s.id))
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => setOpen(c.id)}
              className={`-mb-px flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-medium cursor-pointer ${
                c.id === current.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {c.name}
              {has && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {current.subCategories.map(s => {
          const on = value.includes(s.id)
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => pick(s.id)}
              aria-pressed={on}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 cursor-pointer ${
                on ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"
              }`}
            >
              {s.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
