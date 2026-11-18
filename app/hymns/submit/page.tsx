"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { CheckCircle2, Loader2, Plus, Youtube } from "lucide-react"
import Navbar from "@/components/Navbar"
import HymnSidebar from "@/components/hymns/HymnSidebar"
import HymnCategoryChooser, { type ChooserCategory } from "@/components/hymns/HymnCategoryChooser"
import VideoPreview from "@/components/VideoPreview"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { useTr } from "@/components/home/shared"
import { useVideoSuggestion } from "@/lib/use-video-suggestion"
import type { HymnSuggestion } from "@/lib/video-suggest"

interface Language { id: number; name: string }
interface Category { id: number; name: string; languageId?: number | null }
interface SubCategory { id: number; name: string; categoryId: number }

/** The video id in a YouTube link (or the id itself), or "" if none. */
function parseVideoId(input: string): string {
  const s = input.trim()
  if (!s) return ""
  try {
    const url = new URL(s)
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0]
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v")
      if (v) return v
      const m = url.pathname.match(/\/(?:shorts|live|embed)\/([\w-]{11})/)
      return m?.[1] ?? ""
    }
    return ""
  } catch {
    return /^[\w-]{11}$/.test(s) ? s : ""
  }
}

export default function SubmitHymnPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined
  const { am, tr } = useTr()

  const [videoInput, setVideoInput] = useState("")
  const [singer, setSinger] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [description, setDescription] = useState("")
  const [languageId, setLanguageId] = useState<number | null>(null)
  const [subCategoryIds, setSubCategoryIds] = useState<number[]>([])
  const [showLyrics, setShowLyrics] = useState(false)
  const [showDescription, setShowDescription] = useState(false)

  const [languages, setLanguages] = useState<Language[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch("/api/hymns/admin/languages").then(r => r.json()).catch(() => []),
      fetch("/api/hymns/admin/categories").then(r => r.json()).catch(() => []),
      fetch("/api/hymns/admin/sub-categories").then(r => r.json()).catch(() => []),
    ]).then(([langs, cats, subs]) => {
      setLanguages(Array.isArray(langs) ? langs : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setSubCategories(Array.isArray(subs) ? subs : [])
    })
  }, [])

  // The chosen language's categories, each with its sub-categories.
  const languageCategories: ChooserCategory[] = useMemo(() =>
    categories
      .filter(c => c.languageId === languageId)
      .map(c => ({ id: c.id, name: c.name, subCategories: subCategories.filter(s => s.categoryId === c.id).map(s => ({ id: s.id, name: s.name })) }))
      .filter(c => c.subCategories.length > 0),
  [categories, subCategories, languageId])

  const videoId = parseVideoId(videoInput)

  // Fill in what is still empty from the video, once per pasted link.
  const suggestion = useVideoSuggestion<HymnSuggestion>("hymns", videoId)
  const [filledFor, setFilledFor] = useState("")
  if (suggestion.data && filledFor !== videoId) {
    const d = suggestion.data
    setFilledFor(videoId)
    if (!languageId && d.languageId) {
      setLanguageId(d.languageId)
      if (!subCategoryIds.length) setSubCategoryIds(d.subCategoryIds)
    } else if (languageId === d.languageId && !subCategoryIds.length) {
      setSubCategoryIds(d.subCategoryIds)
    }
    if (!singer.trim() && d.singer) setSinger(d.singer)
  }

  function chooseLanguage(id: number) {
    if (id === languageId) return
    setLanguageId(id)
    setSubCategoryIds([]) // categories belong to a language
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!videoId) { setError(tr("የዩቲዩብ ሊንክ ያስፈልጋል።", "YouTube URL or Video ID is required.")); return }
    if (!languageId) { setError(tr("ቋንቋ ይምረጡ።", "Please select a language.")); return }
    if (subCategoryIds.length === 0) { setError(tr("ቢያንስ አንድ ምድብ ይምረጡ።", "Please select at least one category.")); return }
    const categoryIds = [...new Set(subCategories.filter(s => subCategoryIds.includes(s.id)).map(s => s.categoryId))]

    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/hymns/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          singer: singer.trim() || null,
          lyrics: lyrics || null,
          description: description.trim() || null,
          languageIds: [languageId],
          categoryIds,
          subCategoryIds,
        }),
      })
      if (res.status === 401) { router.push("/auth/login"); return }
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? tr("አልተሳካም።", "Failed to submit")); return }
      setVideoInput(""); setSinger(""); setLyrics(""); setDescription("")
      setSubCategoryIds([]); setShowLyrics(false); setShowDescription(false)
      setEditorKey(k => k + 1)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setSaving(false)
    }
  }

  const label = "text-[15px] font-semibold text-slate-900"
  const input = "w-full rounded-xl bg-slate-50 px-4 py-3 text-[15px] text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16 lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <HymnSidebar userId={userId} />
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{tr("አዲስ መዝሙር", "Add new hymn")}</h1>
          <p className="mt-1 text-sm text-slate-500">{tr("ለግምገማ የዩቲዩብ መዝሙር ያስገቡ", "Submit a YouTube hymn for review")}</p>

          {submitted && (
            <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>
                {tr("መዝሙሩ ገብቷል፤ ከተገመገመ በኋላ ይወጣል። ሌላ ማስገባት ይችላሉ።", "Hymn submitted successfully. It's pending review — you can submit another one below.")}{" "}
                <Link href="/hymns/my-hymns" className="font-semibold underline">{tr("እርስዎ ያስገቧቸው መዝሙራት", "My uploads")}</Link>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-7">
            <div className="space-y-6">
              {/* Video */}
              <div>
                <label htmlFor="video-url" className={label}>{tr("የዩቲዩብ ሊንክ", "YouTube URL")}</label>
                <div className="relative mt-2">
                  <Youtube className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="video-url" value={videoInput} onChange={e => setVideoInput(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" className={`${input} pl-9`} autoComplete="off" />
                </div>
                {videoInput.trim() && !videoId && <p className="mt-2 text-xs text-rose-600">{tr("ትክክለኛ የዩቲዩብ ሊንክ አይደለም።", "Not a YouTube link.")}</p>}
                {videoId && (
                  <VideoPreview
                    videoId={videoId}
                    title={suggestion.data?.video.title}
                    channel={suggestion.data?.video.channel}
                    loading={suggestion.loading}
                    filled={filledFor === videoId && !!suggestion.data}
                    existingHref={suggestion.data?.existing ? `/hymns/${encodeURIComponent(suggestion.data.existing)}` : null}
                    am={am}
                  />
                )}
              </div>

              {/* Language and singer */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className={label}>{tr("ቋንቋ", "Language")}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {languages.map(l => (
                      <button type="button" key={l.id} onClick={() => chooseLanguage(l.id)} aria-pressed={l.id === languageId}
                        className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 cursor-pointer ${l.id === languageId ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"}`}>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="singer" className={label}>{tr("ዘማሪ", "Singer / Artist")}</label>
                  <input id="singer" value={singer} onChange={e => setSinger(e.target.value)} placeholder={tr("ስም (አማራጭ)", "Name (optional)")} className={`${input} mt-2`} />
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className={label}>{tr("ምድብ", "Categories")}</p>
                <div className="mt-2">
                  {languageId ? (
                    languageCategories.length > 0
                      ? <HymnCategoryChooser categories={languageCategories} value={subCategoryIds} onChange={setSubCategoryIds} />
                      : <p className="text-sm text-slate-500">{tr("ለዚህ ቋንቋ ምድብ የለም።", "No categories for this language.")}</p>
                  ) : (
                    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">{tr("መጀመሪያ ቋንቋ ይምረጡ", "Select language first")}</p>
                  )}
                </div>
              </div>

              {/* Lyrics and description, only if wanted */}
              {showLyrics ? (
                <div>
                  <p className={label}>{tr("ግጥም", "Lyrics")}</p>
                  <div className="mt-2"><RichTextEditor key={editorKey} value={lyrics} onChange={setLyrics} placeholder={tr("የመዝሙሩን ግጥም እዚህ ይለጥፉ…", "Paste or type hymn lyrics here…")} /></div>
                </div>
              ) : null}
              {showDescription ? (
                <div>
                  <label htmlFor="description" className={label}>{tr("መግለጫ", "Description")}</label>
                  <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} autoFocus
                    placeholder={tr("ማስታወሻ ወይም ትርጉም (አማራጭ)…", "Optional notes, context, or translation…")} className={`${input} mt-2 resize-none`} />
                </div>
              ) : null}
              {(!showLyrics || !showDescription) && (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {!showLyrics && (
                    <button type="button" onClick={() => setShowLyrics(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                      <Plus className="h-4 w-4" /> {tr("ግጥም ጨምር", "Add lyrics")}
                    </button>
                  )}
                  {!showDescription && (
                    <button type="button" onClick={() => setShowDescription(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                      <Plus className="h-4 w-4" /> {tr("መግለጫ ጨምር", "Add a description")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <div className="mt-7 flex justify-end gap-2 border-t border-slate-100 pt-5">
              <Link href="/hymns/my-hymns" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">{tr("ይቅር", "Cancel")}</Link>
              <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 cursor-pointer">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving ? tr("በማስገባት ላይ…", "Submitting…") : tr("አስገባ", "Submit hymn")}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
