"use client"

import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlignJustify, ArrowLeft, BookOpen, Check, List, Loader2, NotebookPen } from "lucide-react"
import { planTitle } from "@/lib/reading-plan"
import type { PlanDayPage } from "@/lib/reading-plan-server"
import { buildVerseGroups } from "@/lib/verse-groups"
import { useTr, readingHref, readingText, longDate } from "./shared"

type SaveState = "idle" | "saving" | "saved" | "error"

// Same setting, and same storage key, as the Bible reader's "By verse /
// Paragraph" switch: choosing a layout in one place applies in both.
type ViewMode = "line" | "paragraph"
const VIEW_KEY = "bible_view_mode"
const VIEW_EVENT = "bible-view-mode"

function readViewMode(): ViewMode {
  try { return localStorage.getItem(VIEW_KEY) === "paragraph" ? "paragraph" : "line" } catch { return "line" }
}
function subscribeViewMode(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(VIEW_EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(VIEW_EVENT, onChange)
  }
}
function setViewMode(mode: ViewMode) {
  try { localStorage.setItem(VIEW_KEY, mode) } catch {}
  window.dispatchEvent(new Event(VIEW_EVENT))
}

/** One day of a plan: its passages, "mark as read", and a note alongside. */
export default function PlanDayReader({ data }: { data: PlanDayPage }) {
  const { am, tr } = useTr()
  const router = useRouter()
  const [done, setDone] = useState(data.completed)
  const [busy, setBusy] = useState(false)
  const view = useSyncExternalStore(subscribeViewMode, readViewMode, () => "line" as ViewMode)

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {tr("ወደ መነሻ ገጽ", "Back to home")}
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            {planTitle(data.title.config, data.title.totalDays, am ? "am" : "en")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {tr(`ቀን ${data.dayNumber} ከ ${data.title.totalDays}`, `Day ${data.dayNumber} of ${data.title.totalDays}`)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{longDate(data.date)}</p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label={tr("አቀራረብ", "View")}>
          {([["line", List, tr("በጥቅስ", "By verse")], ["paragraph", AlignJustify, tr("በአንቀጽ", "Paragraph")]] as const).map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-pressed={view === mode}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                view === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </header>

      {data.passages.length > 1 && (
        <nav className="mt-5 flex flex-wrap gap-2">
          {data.passages.map((p, i) => (
            <a key={i} href={`#passage-${i}`} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300">
              {readingText(p.reading, data.bookNames, am)}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div>
          <div className="space-y-6">
            {data.passages.map((p, i) => (
              <article key={i} id={`passage-${i}`} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-lg font-semibold text-slate-900">{readingText(p.reading, data.bookNames, am)}</h2>
                  <Link href={readingHref(p.reading, am)} className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-medium text-slate-400 hover:text-blue-600">
                    <BookOpen className="h-3.5 w-3.5" /> {tr("በመጽሐፍ ቅዱስ ይክፈቱ", "Open in Bible")}
                  </Link>
                </div>
                <Passage verses={p.verses} am={am} view={view} chapterLabel={c => tr(`ምዕራፍ ${c}`, `Chapter ${c}`)} />
              </article>
            ))}
          </div>

          <button
            onClick={toggleDone}
            disabled={busy}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-70 ${
              done ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {done ? tr("ተነቧል — ለመቀልበስ ይጫኑ", "Read — tap to undo") : tr("እንደተነበበ ይመዝግቡ", "Mark as read")}
          </button>
        </div>

        <aside className="lg:sticky lg:top-24">
          <NoteEditor planId={data.planId} dayNumber={data.dayNumber} initial={data.note} />
        </aside>
      </div>
    </div>
  )
}

function Passage({ verses, am, view, chapterLabel }: {
  verses: PlanDayPage["passages"][number]["verses"]
  am: boolean
  view: ViewMode
  chapterLabel: (chapter: number) => string
}) {
  const breakBefore = (j: number) => j > 0 && verses[j].chapter !== verses[j - 1].chapter
  const heading = (chapter: number) => (
    <span className="mb-1 mt-5 block text-xs font-semibold uppercase tracking-wider text-slate-400">{chapterLabel(chapter)}</span>
  )

  if (view === "paragraph") {
    return (
      <p className="mt-4 text-[17px] leading-8 text-slate-800">
        {verses.map((v, j) => (
          <Fragment key={`${v.chapter}:${v.verse}`}>
            {breakBefore(j) && heading(v.chapter)}
            <sup className="mr-1 text-[11px] font-semibold text-slate-400">{v.verse}</sup>
            {am ? v.am : v.en}{" "}
          </Fragment>
        ))}
      </p>
    )
  }

  // Verse by verse, empty numbers merge into the verse that carries their text
  // ("2–3"), as in the Bible reader. Groups never cross a chapter break.
  const chapters: (typeof verses)[] = []
  verses.forEach((v, j) => {
    if (j === 0 || breakBefore(j)) chapters.push([])
    chapters[chapters.length - 1].push(v)
  })

  return (
    <div className="mt-4 space-y-2">
      {chapters.map((chapterVerses, c) => (
        <Fragment key={chapterVerses[0].chapter}>
          {c > 0 && heading(chapterVerses[0].chapter)}
          {buildVerseGroups(chapterVerses, v => (am ? v.am : v.en)).map(g => (
            <p key={g.label} className="flex gap-3 text-[17px] leading-8 text-slate-800">
              <span className="w-9 flex-shrink-0 pt-0.5 text-right text-xs font-semibold leading-8 text-slate-400">{g.label}</span>
              <span className="min-w-0">{g.text}</span>
            </p>
          ))}
        </Fragment>
      ))}
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
