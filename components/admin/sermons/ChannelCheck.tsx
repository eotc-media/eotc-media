"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Loader2, Plus, RefreshCw } from "lucide-react"

export interface CheckedVideo {
  videoId: string
  title: string
  channel: string
  minutes: number | null
  verdict: string
  reason: string | null
  checkedAt: string
  /** The sermon it became, if any: Submitted, Accepted or Declined. */
  sermonStatus: string | null
}

/** What the daily channel check found, and a way to correct it. */
export default function ChannelCheck({ videos }: { videos: CheckedVideo[] }) {
  const [tab, setTab] = useState<"sermon" | "not_sermon">("sermon")
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  const shown = videos.filter(v => v.verdict === tab)
  const count = (k: string) => videos.filter(v => v.verdict === k).length

  async function runNow() {
    setRunning(true)
    setMessage(null)
    const res = await fetch("/api/sermons/admin/channel-check/run", { method: "POST" }).catch(() => null)
    const d = res ? await res.json().catch(() => null) : null
    setRunning(false)
    if (!res?.ok || !d) { setMessage("The check could not run. Try again in a minute."); return }
    const note = `Looked at ${d.channels} channels: ${d.newVideos} new videos, ${d.sermons} added as sermons, ${d.notSermons} passed over.`
    setMessage(d.errors?.length ? `${note} Problems: ${d.errors.slice(0, 3).join("; ")}` : note)
    if (d.newVideos > 0) setTimeout(() => window.location.reload(), 2500)
  }

  async function add(videoId: string) {
    setBusy(videoId)
    const res = await fetch(`/api/sermons/admin/channel-check/${encodeURIComponent(videoId)}/add`, { method: "POST" }).catch(() => null)
    const d = res ? await res.json().catch(() => null) : null
    setBusy(null)
    if (res?.ok) setAdded(s => new Set(s).add(videoId))
    else setMessage(d?.error ?? "Couldn't add that video.")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Runs every day at 04:23 UTC. You can also run it now.</p>
        <button onClick={runNow} disabled={running} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {running ? "Checking channels…" : "Run now"}
        </button>
      </div>
      {message && <p className="rounded-lg bg-muted px-4 py-2.5 text-sm">{message}</p>}

      <div className="flex rounded-lg bg-muted p-1 w-fit">
        {([["sermon", "Added as sermons"], ["not_sermon", "Passed over"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer ${tab === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {label} <span className="ml-1 text-xs tabular-nums opacity-70">{count(k)}</span>
          </button>
        ))}
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {shown.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Nothing yet. The first check runs tonight, or press Run now.</li>}
        {shown.map(v => (
          <li key={v.videoId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`} alt="" className="aspect-video w-full flex-shrink-0 rounded-lg object-cover sm:w-32" />
            <div className="min-w-0 flex-1">
              <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" className="font-medium leading-snug hover:text-blue-700">{v.title}</a>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {v.channel}{v.minutes ? ` · ${v.minutes} min` : ""} · checked {new Date(v.checkedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </p>
              {v.reason && <p className="mt-1 text-xs text-muted-foreground italic">{v.reason}</p>}
            </div>
            <div className="flex-shrink-0">
              {v.verdict === "sermon" ? (
                v.sermonStatus === "Submitted"
                  ? <Link href="/sermons/admin/sermons?status=pending" className="text-sm font-medium text-blue-600 hover:underline">Review in New sermons</Link>
                  : <span className="text-xs font-medium text-muted-foreground">{v.sermonStatus ?? "Removed"}</span>
              ) : added.has(v.videoId) ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Added to New sermons</span>
              ) : (
                <button onClick={() => add(v.videoId)} disabled={busy !== null} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60 cursor-pointer">
                  {busy === v.videoId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} It is a sermon
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
