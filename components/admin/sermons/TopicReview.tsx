"use client"

import { useMemo, useState } from "react"
import { Check, CheckCheck, Loader2, Plus, Sparkles, X } from "lucide-react"
import type { Topic } from "@/lib/sermon-topics"

export interface ReviewSermon {
  id: number
  slug: string
  title: string
  image: string
  channel: string
  /** The old category and sub-category names, for reference. */
  previous: string[]
  topicIds: number[]
  approved: boolean
}

type Tab = "review" | "approved" | "none"
const PAGE = 30
const MAX = 3

/** Review Gemini's topic suggestions: change any that are wrong, approve. */
export default function TopicReview({ sermons, topics, groups }: {
  sermons: ReviewSermon[]
  topics: Topic[]
  groups: { key: string; en: string }[]
}) {
  const [state, setState] = useState(() => new Map(sermons.map(s => [s.id, { topicIds: s.topicIds, approved: s.approved }])))
  const [tab, setTab] = useState<Tab>("review")
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState<number | "all" | "every" | null>(null)
  const [suggesting, setSuggesting] = useState<{ remaining: number } | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const byId = useMemo(() => new Map(topics.map(t => [t.id, t])), [topics])
  const status = (id: number): Tab => {
    const s = state.get(id)!
    return s.topicIds.length === 0 ? "none" : s.approved ? "approved" : "review"
  }
  const counts = { review: 0, approved: 0, none: 0 }
  sermons.forEach(s => counts[status(s.id)]++)
  const list = sermons.filter(s => status(s.id) === tab)
  const shown = list.slice(page * PAGE, page * PAGE + PAGE)
  const pages = Math.max(1, Math.ceil(list.length / PAGE))

  const update = (id: number, change: Partial<{ topicIds: number[]; approved: boolean }>) =>
    setState(m => new Map(m).set(id, { ...m.get(id)!, ...change }))

  // Run Gemini over every sermon that has no topics, a batch at a time.
  async function suggestAll() {
    setMessage(null)
    setSuggesting({ remaining: counts.none })
    let progressed = false
    for (;;) {
      const res = await fetch("/api/sermons/admin/topics/suggest", { method: "POST" }).catch(() => null)
      const data = res ? await res.json().catch(() => null) : null
      if (!res?.ok || !data) {
        setMessage(`Stopped: ${data?.error ?? "the request failed"}. ${progressed ? "What was done is saved; reload to see it, or" : ""} Try again in a minute.`)
        setSuggesting(null)
        return
      }
      progressed = progressed || data.handled > 0
      setSuggesting({ remaining: data.remaining })
      if (data.handled === 0 || data.remaining === 0) break
    }
    // Show the new suggestions.
    window.location.reload()
  }

  async function save(id: number) {
    const s = state.get(id)!
    setBusy(id)
    const changed = sermons.find(x => x.id === id)!.topicIds.join() !== s.topicIds.join()
    const res = changed
      ? await fetch(`/api/sermons/admin/topics/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicIds: s.topicIds }) }).catch(() => null)
      : await fetch("/api/sermons/admin/topics/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sermonIds: [id] }) }).catch(() => null)
    setBusy(null)
    if (res?.ok) update(id, { approved: true })
    else setMessage("Couldn't save that sermon. Try again.")
  }

  // Every suggestion still to review, as suggested (edited ones on other pages
  // are saved first, as on a single page).
  async function approveAll() {
    if (!window.confirm(`Approve the suggested topics of all ${list.length} sermons as they are?`)) return
    setBusy("every")
    const edited = list.filter(s => s.topicIds.join() !== state.get(s.id)!.topicIds.join())
    for (const s of edited) await save(s.id)
    const plain = list.filter(s => !edited.includes(s) && state.get(s.id)!.topicIds.length > 0).map(s => s.id)
    for (let i = 0; i < plain.length; i += 100) {
      const ids = plain.slice(i, i + 100)
      const res = await fetch("/api/sermons/admin/topics/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sermonIds: ids }) }).catch(() => null)
      if (res?.ok) ids.forEach(id => update(id, { approved: true }))
      else { setMessage("Couldn't approve them all. Try again."); break }
    }
    setBusy(null)
  }

  async function approvePage() {
    // Sermons whose topics were edited here are saved one by one; the rest at once.
    setBusy("all")
    const edited = shown.filter(s => s.topicIds.join() !== state.get(s.id)!.topicIds.join())
    for (const s of edited) await save(s.id)
    const plain = shown.filter(s => !edited.includes(s) && state.get(s.id)!.topicIds.length > 0).map(s => s.id)
    if (plain.length) {
      const res = await fetch("/api/sermons/admin/topics/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sermonIds: plain }) }).catch(() => null)
      if (res?.ok) plain.forEach(id => update(id, { approved: true }))
      else setMessage("Couldn't approve this page. Try again.")
    }
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      {/* Summary and the Gemini run */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{counts.approved}</span> approved ·{" "}
          <span className="font-semibold text-foreground">{counts.review}</span> to review ·{" "}
          <span className="font-semibold text-foreground">{counts.none}</span> without topics
        </p>
        {counts.none > 0 && (
          <button
            onClick={suggestAll}
            disabled={!!suggesting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {suggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {suggesting ? `Suggesting… ${suggesting.remaining} left` : `Suggest topics for ${counts.none} sermons`}
          </button>
        )}
      </div>
      {message && <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{message}</p>}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-muted p-1">
          {([["review", "To review"], ["approved", "Approved"], ["none", "No topics"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => { setTab(k); setPage(0) }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer ${tab === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label} <span className="ml-1 text-xs tabular-nums opacity-70">{counts[k]}</span>
            </button>
          ))}
        </div>
        {tab === "review" && shown.length > 0 && (
          <div className="flex flex-wrap gap-2">
          {list.length > shown.length && (
            <button onClick={approveAll} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60 cursor-pointer">
              {busy === "every" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Approve all {list.length}
            </button>
          )}
          <button onClick={approvePage} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60 cursor-pointer">
            {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Approve all {shown.length} on this page
          </button>
          </div>
        )}
      </div>

      {/* Sermons */}
      <ul className="divide-y rounded-xl border bg-card">
        {shown.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Nothing here.</li>}
        {shown.map(s => {
          const cur = state.get(s.id)!
          return (
            <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" className="aspect-video w-full flex-shrink-0 rounded-lg object-cover sm:w-36" />
              <div className="min-w-0 flex-1">
                <a href={`/sermons/${encodeURIComponent(s.slug)}`} target="_blank" rel="noreferrer" className="font-medium leading-snug hover:text-blue-700">{s.title}</a>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.channel}{s.previous.length > 0 && <> · was: {s.previous.join(" / ")}</>}
                </p>
                <TopicPicker
                  value={cur.topicIds}
                  byId={byId}
                  topics={topics}
                  groups={groups}
                  onChange={ids => update(s.id, { topicIds: ids, approved: false })}
                />
              </div>
              <div className="flex flex-shrink-0 items-start">
                {cur.approved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Approved</span>
                ) : (
                  <button
                    onClick={() => save(s.id)}
                    disabled={cur.topicIds.length === 0 || busy !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                  >
                    {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border px-3 py-1.5 disabled:opacity-40 cursor-pointer">Previous</button>
          <span className="text-muted-foreground tabular-nums">Page {page + 1} of {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="rounded-lg border px-3 py-1.5 disabled:opacity-40 cursor-pointer">Next</button>
        </div>
      )}
    </div>
  )
}

/** A sermon's topics as chips, with a grouped list to add one. */
function TopicPicker({ value, byId, topics, groups, onChange }: {
  value: number[]
  byId: Map<number, Topic>
  topics: Topic[]
  groups: { key: string; en: string }[]
  onChange: (ids: number[]) => void
}) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      {value.map(id => (
        <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-2.5 pr-1 text-xs font-medium text-blue-800">
          {byId.get(id)?.nameEn} <span className="text-blue-800/60">· {byId.get(id)?.nameAm}</span>
          <button onClick={() => onChange(value.filter(x => x !== id))} className="rounded-full p-0.5 hover:bg-blue-100 cursor-pointer" aria-label="Remove topic"><X className="h-3 w-3" /></button>
        </span>
      ))}
      {value.length < MAX && (
        <label className="relative inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3 w-3" /> Add topic
          <select
            value=""
            onChange={e => e.target.value && onChange([...value, Number(e.target.value)])}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Add topic"
          >
            <option value="">Add topic</option>
            {groups.map(g => (
              <optgroup key={g.key} label={g.en}>
                {topics.filter(t => t.groupKey === g.key && !value.includes(t.id)).map(t => (
                  <option key={t.id} value={t.id}>{t.nameEn} · {t.nameAm}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
