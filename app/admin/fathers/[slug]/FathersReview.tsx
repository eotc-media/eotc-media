"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, RotateCcw, Upload } from "lucide-react"

interface Section {
  id: number
  position: number
  title: string
  titleAm: string | null
  body: string
  bodyAm: string | null
  bodyAmApproved: boolean
}

/** Upload a translation file, then read, correct and approve chapter by chapter. */
export default function FathersReview({ slug, sections }: { slug: string; sections: Section[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  const translated = sections.filter(s => s.bodyAm).length
  const approved = sections.filter(s => s.bodyAmApproved).length

  async function upload(file: File) {
    setBusy(true)
    setMessage("")
    try {
      const json = JSON.parse(await file.text())
      const res = await fetch(`/api/admin/fathers/${slug}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      })
      const data = await res.json()
      setMessage(res.ok
        ? `Imported ${data.imported} chapter(s)${data.skipped ? `; ${data.skipped} skipped (already approved, or not Amharic)` : ""}. Review them below.`
        : data.error ?? "Upload failed.")
      router.refresh()
    } catch {
      setMessage("That file could not be read. Upload the .am.json file the script wrote.")
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function approveAll() {
    if (!confirm(`Approve all ${translated - approved} translated chapters that are waiting? Readers will see them in Amharic.`)) return
    setBusy(true)
    await fetch(`/api/admin/fathers/${slug}/approve-all`, { method: "POST" })
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <p className="mr-auto text-sm text-muted-foreground">
          {translated} of {sections.length} chapters translated · {approved} approved
        </p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload translation
        </button>
        <button
          onClick={approveAll}
          disabled={busy || translated === approved}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          <Check className="h-4 w-4" /> Approve all waiting
        </button>
        {message && <p className="w-full text-sm text-slate-700">{message}</p>}
        <p className="w-full text-xs text-muted-foreground">
          Make the file on your computer: <code>node scripts/fathers/translate.mjs {slug} --model gemini-4-argon</code> (instructions at the top of the script).
        </p>
      </div>

      {sections.map(s => <SectionReview key={s.id} section={s} />)}
    </div>
  )
}

function SectionReview({ section }: { section: Section }) {
  const router = useRouter()
  const [text, setText] = useState(section.bodyAm ?? "")
  const [title, setTitle] = useState(section.titleAm ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const edited = text !== (section.bodyAm ?? "") || title !== (section.titleAm ?? "")

  async function save(approved?: boolean) {
    setSaving(true)
    setError("")
    const res = await fetch(`/api/admin/fathers/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(edited ? { bodyAm: text, titleAm: title } : {}), ...(approved !== undefined ? { approved } : {}) }),
    })
    setSaving(false)
    if (!res.ok) setError((await res.json().catch(() => null))?.error ?? "Could not save.")
    router.refresh()
  }

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <h2 className="mr-auto text-sm font-semibold">{section.position}. {section.title}</h2>
        {section.bodyAmApproved
          ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Approved</span>
          : section.bodyAm
            ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Waiting for review</span>
            : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Not translated</span>}
      </header>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          {section.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="space-y-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Chapter title in Amharic"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-semibold"
          />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={Math.min(24, Math.max(8, Math.ceil(text.length / 70)))}
            placeholder="No translation yet. Upload a file above, or write it here."
            className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-[15px] leading-7"
          />
          <div className="flex flex-wrap items-center gap-2">
            {edited && (
              <button onClick={() => save()} disabled={saving} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50">
                Save
              </button>
            )}
            {!section.bodyAmApproved ? (
              <button
                onClick={() => save(true)}
                disabled={saving || !text.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {edited ? "Save and approve" : "Approve"}
              </button>
            ) : (
              <button onClick={() => save(false)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50">
                <RotateCcw className="h-3.5 w-3.5" /> Back to review
              </button>
            )}
            {error && <span className="text-sm text-rose-600">{error}</span>}
          </div>
        </div>
      </div>
    </section>
  )
}
