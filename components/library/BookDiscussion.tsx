"use client"

import { useState } from "react"
import { Flag, X } from "lucide-react"
import type { LibraryBook } from "@/lib/library-shelves"
import { useTr } from "@/components/home/shared"

/** Readers' comments on a book, and a quiet way to report a copyright problem. */
export default function BookDiscussion({ slug, initial, signedIn }: {
  slug: string
  initial: LibraryBook["comments"]
  signedIn: boolean
}) {
  const { tr } = useTr()
  const [comments, setComments] = useState(initial)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState("")
  const [reported, setReported] = useState(false)
  const api = `/api/books/${encodeURIComponent(slug)}`
  const toLogin = () => { window.location.href = "/auth/login" }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!signedIn) return toLogin()
    if (!text.trim()) return
    setBusy(true)
    const res = await fetch(`${api}/comment`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment: text.trim() }),
    }).catch(() => null)
    if (res?.ok) {
      const c = await res.json()
      setComments(prev => [...prev, { id: c.id, name: c.user?.name ?? "", comment: c.comment, createdAt: c.createdAt }])
      setText("")
    }
    setBusy(false)
  }

  async function report(remove = false) {
    if (!signedIn) return toLogin()
    const res = await fetch(`${api}/copyright`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, remove }),
    }).catch(() => null)
    if (res?.ok) {
      setReported((await res.json()).reported)
      setReporting(false)
      setReason("")
    }
  }

  return (
    <section className="rounded-2xl bg-white ring-1 ring-slate-200">
      <h2 className="flex items-center justify-between border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-900">
        {tr("አስተያየቶች", "Comments")}
        <span className="text-xs font-medium text-slate-400">{comments.length}</span>
      </h2>

      <div className="px-6 py-5">
        {comments.length > 0 && (
          <ul className="mb-6 space-y-5">
            {comments.map(c => (
              <li key={c.id} className="flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {c.name.trim()[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold text-slate-900">{c.name || tr("አንባቢ", "Reader")}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-line text-sm leading-6 text-slate-700">{c.comment}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {signedIn ? (
          <form onSubmit={submit}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              placeholder={tr("ስለ መጽሐፉ አስተያየት ይጻፉ…", "Share a thought about this book…")}
              className="w-full resize-none rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="mt-2 flex justify-end">
              <button
                disabled={busy || !text.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {tr("አስተያየት ይስጡ", "Comment")}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-500">
            <a href="/auth/login" className="font-semibold text-blue-600 hover:underline">{tr("ይግቡ", "Sign in")}</a>{" "}
            {tr("አስተያየት ለመስጠት።", "to leave a comment.")}
          </p>
        )}
      </div>

      <div className="border-t border-slate-100 px-6 py-3">
        <button onClick={() => (signedIn ? setReporting(true) : toLogin())} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 cursor-pointer">
          <Flag className="h-3.5 w-3.5" />
          {reported ? tr("የቅጂ መብት ጥሰት ሪፖርት ተደርጓል", "Copyright problem reported") : tr("የቅጂ መብት ችግር ሪፖርት ያድርጉ", "Report a copyright problem")}
        </button>
      </div>

      {reporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={() => setReporting(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{tr("የቅጂ መብት ችግር", "Report a copyright problem")}</h3>
              <button onClick={() => setReporting(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder={tr("ምክንያት (አማራጭ)", "Reason (optional)")}
              className="mt-4 w-full resize-none rounded-xl px-3.5 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              {reported && (
                <button onClick={() => report(true)} className="rounded-xl px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer">{tr("ሪፖርቱን ያንሱ", "Withdraw report")}</button>
              )}
              <button onClick={() => setReporting(false)} className="rounded-xl px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer">{tr("ይቅር", "Cancel")}</button>
              <button onClick={() => report(false)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">{tr("ሪፖርት አድርግ", "Report")}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
