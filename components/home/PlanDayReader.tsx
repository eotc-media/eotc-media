"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, Loader2, NotebookPen } from "lucide-react"
import { planTitle } from "@/lib/reading-plan"
import type { PlanDayPage } from "@/lib/reading-plan-server"
import { useTr, readingHref, readingText, longDate } from "./shared"

type SaveState = "idle" | "saving" | "saved" | "error"

/** One day of a plan: just its passages, then "mark as read" and a note. */
export default function PlanDayReader({ data }: { data: PlanDayPage }) {
  const { am, tr } = useTr()
  const router = useRouter()
  const [done, setDone] = useState(data.completed)
  const [busy, setBusy] = useState(false)

  async function toggleDone() {
    const next = !done
    setDone(next)
    setBusy(true)
    const res = await fetch(`/api/reading-plans/${data.planId}/days/${data.dayNumber}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    }).catch(() => null)
    setBusy(false)
    if (!res?.ok) setDone(!next)
    else router.refresh()
  }

  const dayHref = (n: number) => `/reading-plan/day/${n}`

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {tr("ወደ መነሻ ገጽ", "Back to home")}
      </Link>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          {planTitle(data.title.config, data.title.totalDays, am ? "am" : "en")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {tr(`ቀን ${data.dayNumber} ከ ${data.title.totalDays}`, `Day ${data.dayNumber} of ${data.title.totalDays}`)}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{longDate(data.date)}</p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {data.passages.map((p, i) => (
            <a key={i} href={`#passage-${i}`} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300">
              {readingText(p.reading, data.bookNames, am)}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-8 space-y-6">
        {data.passages.map((p, i) => (
          <article key={i} id={`passage-${i}`} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">{readingText(p.reading, data.bookNames, am)}</h2>
              <Link href={readingHref(p.reading, am)} className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-medium text-slate-400 hover:text-blue-600">
                <BookOpen className="h-3.5 w-3.5" /> {tr("በመጽሐፍ ቅዱስ ይክፈቱ", "Open in Bible")}
              </Link>
            </div>
            <p className="mt-4 text-[17px] leading-8 text-slate-800">
              {p.verses.map((v, j) => {
                const newChapter = j > 0 && v.chapter !== p.verses[j - 1].chapter
                const text = am ? v.am : v.en
                return (
                  <Fragment key={`${v.chapter}:${v.verse}`}>
                    {newChapter && (
                      <span className="mb-1 mt-5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {tr(`ምዕራፍ ${v.chapter}`, `Chapter ${v.chapter}`)}
                      </span>
                    )}
                    <sup className="mr-1 text-[11px] font-semibold text-slate-400">{v.verse}</sup>
                    {text}{" "}
                  </Fragment>
                )
              })}
            </p>
          </article>
        ))}
      </div>

      <button
        onClick={toggleDone}
        disabled={busy}
        className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-70 ${
          done ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {done ? tr("ተነቧል — ለመቀልበስ ይጫኑ", "Read — tap to undo") : tr("እንደተነበበ ይመዝግቡ", "Mark as read")}
      </button>

      <NoteEditor planId={data.planId} dayNumber={data.dayNumber} initial={data.note} />

      <nav className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6 text-sm font-semibold">
        {data.hasPrev ? (
          <Link href={dayHref(data.dayNumber - 1)} className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> {tr(`ቀን ${data.dayNumber - 1}`, `Day ${data.dayNumber - 1}`)}
          </Link>
        ) : <span />}
        <Link href="/reading-plan" className="text-slate-500 hover:text-slate-800">{tr("ሙሉ መርሐ ግብር", "Full schedule")}</Link>
        {data.hasNext ? (
          <Link href={dayHref(data.dayNumber + 1)} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700">
            {tr(`ቀን ${data.dayNumber + 1}`, `Day ${data.dayNumber + 1}`)} <ChevronRight className="h-4 w-4" />
          </Link>
        ) : <span />}
      </nav>
    </div>
  )
}

function persistNote(planId: number, dayNumber: number, note: string): Promise<boolean> {
  return fetch(`/api/reading-plans/${planId}/days/${dayNumber}/note`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
    keepalive: true, // lets a save started while leaving the page finish
  }).then(r => r.ok, () => false)
}

/** Saves on its own a moment after typing stops, on leaving the box, and on leaving the page. */
function NoteEditor({ planId, dayNumber, initial }: { planId: number; dayNumber: number; initial: string }) {
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
    if (await persistNote(planId, dayNumber, value)) {
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
    if (latest.current !== saved.current) persistNote(planId, dayNumber, latest.current)
  }, [planId, dayNumber])

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
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
        rows={5}
        placeholder={tr("ከዛሬው ንባብ ያገኙትን ሐሳብ፣ ጸሎት ወይም ጥያቄ ይጻፉ…", "What stood out to you today — a thought, a prayer, a question…")}
        className="mt-3 block w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] leading-7 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <p className="mt-2 text-xs text-slate-400">{tr("ማስታወሻዎ ለእርስዎ ብቻ ይታያል።", "Only you can see your notes.")}</p>
    </section>
  )
}
