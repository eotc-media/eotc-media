"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { useTr, longDate, WEEKDAY_SHORT_AM, WEEKDAY_SHORT_EN } from "./shared"

/** Change a running plan's days off. Days already read stay as they are; the
 *  rest of the plan is laid out again on the new week, from today. */
export default function RestDaysDialog({ planId, initial, today, onClose }: {
  planId: number
  initial: number[]
  today: string
  onClose: () => void
}) {
  const { am, tr } = useTr()
  const router = useRouter()
  const [rest, setRest] = useState<number[]>(initial)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const changed = [...rest].sort().join() !== [...initial].sort().join()

  const send = (preview: boolean) =>
    fetch(`/api/reading-plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restWeekdays: rest, today, preview }),
    })

  // The finish date the new week would give, worked out by the server.
  useEffect(() => {
    let live = true
    send(true).then(r => (r.ok ? r.json() : null)).then(d => { if (live) setEndDate(d?.endDate ?? null) }).catch(() => {})
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest])

  async function save() {
    setSaving(true)
    setError(false)
    const res = await send(false).catch(() => null)
    setSaving(false)
    if (!res?.ok) { setError(true); return }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 pb-4 sm:items-center sm:pb-0" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-slate-900">{tr("የዕረፍት ቀናት", "Days off")}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {tr(
                "የተነበቡት ቀናት እንዳሉ ይቆያሉ፤ የቀሩት ንባቦች ከዛሬ ጀምሮ በአዲሱ ሳምንት ይደለደላሉ።",
                "Days you've read stay as they are. The remaining readings are laid out again from today, on the new week.",
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer" aria-label={tr("ዝጋ", "Close")}><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 flex gap-1.5">
          {(am ? WEEKDAY_SHORT_AM : WEEKDAY_SHORT_EN).map((label, i) => {
            const on = rest.includes(i)
            return (
              <button
                key={i}
                onClick={() => setRest(on ? rest.filter(x => x !== i) : rest.length < 6 ? [...rest, i] : rest)}
                aria-pressed={on}
                className={`h-10 w-10 rounded-full text-xs font-semibold transition-colors cursor-pointer sm:h-11 sm:w-11 ${
                  on ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {rest.length === 0 ? tr("በየቀኑ ያነባሉ።", "You'll read every day.") : tr("የጨለሙት ቀናት የዕረፍት ቀናት ናቸው።", "Dark days are days off.")}
        </p>

        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {tr("ዕቅዱ የሚያልቀው", "The plan will finish on")}{" "}
          <span className="font-semibold text-slate-900">{endDate ? longDate(endDate) : "…"}</span>
        </p>
        {error && <p className="mt-3 text-sm text-rose-600">{tr("አልተቀመጠም፤ እንደገና ይሞክሩ።", "Couldn't save. Please try again.")}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer">{tr("ይቅር", "Cancel")}</button>
          <button
            onClick={save}
            disabled={!changed || saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {tr("አስቀምጥ", "Save")}
          </button>
        </div>
      </div>
    </div>
  )
}
