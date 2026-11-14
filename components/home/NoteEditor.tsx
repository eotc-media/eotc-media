"use client"

import { useEffect, useRef, useState } from "react"
import { NotebookPen } from "lucide-react"
import { useTr } from "./shared"

// A private note that saves itself: a moment after typing stops, on leaving
// the box, and on leaving the page. Used on a plan's day and in the online
// reader.

type SaveState = "idle" | "saving" | "saved" | "error"

function persistNote(url: string, note: string): Promise<boolean> {
  return fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
    keepalive: true, // lets a save started while leaving the page finish
  }).then(r => r.ok, () => false)
}

/** Saves on its own a moment after typing stops, on leaving the box, and on leaving the page. */
export default function NoteEditor({ url, initial }: {
  /** Where the note is saved: PUT { note }. */
  url: string
  initial: string
}) {
  const { tr } = useTr()
  const [text, setText] = useState(initial)
  const [state, setState] = useState<SaveState>("idle")
  const saved = useRef(initial)
  const latest = useRef(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  async function save() {
    clearTimeout(timer.current)
    const value = latest.current
    if (value === saved.current) return
    setState("saving")
    if (await persistNote(url, value)) {
      saved.current = value
      setState("saved")
    } else {
      setState("error")
    }
  }

  function onChange(value: string) {
    setText(value)
    latest.current = value
    clearTimeout(timer.current)
    timer.current = setTimeout(save, 800)
  }

  useEffect(() => () => {
    clearTimeout(timer.current)
    if (latest.current !== saved.current) persistNote(url, latest.current)
  }, [url])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <NotebookPen className="h-4 w-4 text-slate-400" /> {tr("ማስታወሻ", "Notes")}
        </h2>
        <span className="text-xs text-slate-400" aria-live="polite">
          {state === "saving" && tr("በማስቀመጥ ላይ…", "Saving…")}
          {state === "saved" && tr("ተቀምጧል", "Saved")}
          {state === "error" && <span className="text-rose-600">{tr("አልተቀመጠም፤ እንደገና ይሞክሩ", "Not saved — try again")}</span>}
        </span>
      </div>
      <textarea
        value={text}
        onChange={e => onChange(e.target.value)}
        onBlur={save}
        maxLength={5000}
        rows={8}
        placeholder={tr("ከዛሬው ንባብ ያገኙትን ሐሳብ፣ ጸሎት ወይም ጥያቄ ይጻፉ…", "What stood out to you today — a thought, a prayer, a question…")}
        className="mt-3 block w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] leading-7 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <p className="mt-2 text-xs text-slate-400">{tr("ማስታወሻዎ ለእርስዎ ብቻ ይታያል።", "Only you can see your notes.")}</p>
    </section>
  )
}
