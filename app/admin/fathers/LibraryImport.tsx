"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"

/** Upload a library file (scripts/fathers/to_bundle.py) to add or refresh works. */
export default function LibraryImport() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string[]>([])

  async function upload(file: File) {
    setBusy(true)
    setMessage([`Uploading ${file.name}…`])
    try {
      const res = await fetch("/api/admin/fathers/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: await file.text(),
      })
      const data = await res.json().catch(() => ({ error: `Upload failed (${res.status}).` }))
      setMessage(res.ok ? [...data.works, `${data.linked} Books entr${data.linked === 1 ? "y" : "ies"} linked.`] : [data.error])
      router.refresh()
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
      <p className="mr-auto text-sm text-muted-foreground">Add works, or refresh their English text, from a library file.</p>
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import library file
      </button>
      {message.length > 0 && (
        <ul className="w-full space-y-0.5 text-sm text-slate-700">{message.map((m, i) => <li key={i}>{m}</li>)}</ul>
      )}
    </div>
  )
}
