"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { CheckCircle2, Loader2, Plus, Youtube } from "lucide-react"
import TopicChooser from "@/components/sermons/TopicChooser"
import Navbar from "@/components/Navbar"
import SermonSidebar from "@/components/sermons/SermonSidebar"
import { useTr } from "@/components/home/shared"

interface Language { id: number; name: string }
interface Topic { id: number; slug: string; groupKey: string; nameAm: string; nameEn: string }

const MAX_TOPICS = 3

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

export default function SubmitSermonPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined
  const { am, tr } = useTr()

  const [videoInput, setVideoInput] = useState("")
  const [preacher, setPreacher] = useState("")
  const [description, setDescription] = useState("")
  const [languageIds, setLanguageIds] = useState<number[]>([])
  const [topicIds, setTopicIds] = useState<number[]>([])

  const [languages, setLanguages] = useState<Language[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [showDescription, setShowDescription] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/sermons/admin/languages").then(r => r.json()).catch(() => []),
      fetch("/api/sermons/topics").then(r => r.json()).catch(() => ({})),
    ]).then(([langs, t]) => {
      setLanguages(Array.isArray(langs) ? langs : [])
      setTopics(Array.isArray(t?.topics) ? t.topics : [])
    })
  }, [])

  const videoId = parseVideoId(videoInput)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!videoId) { setError(tr("የዩቲዩብ ሊንክ ያስፈልጋል።", "YouTube URL or Video ID is required.")); return }
    if (languageIds.length === 0) { setError(tr("ቋንቋ ይምረጡ።", "Please select a language.")); return }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/sermons/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoInput.trim(),
          preacher: preacher.trim() || null,
          description: description.trim() || null,
          languageIds,
          topicIds,
        }),
      })
      if (res.status === 401) { router.push("/auth/login"); return }
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? tr("አልተሳካም።", "Failed to submit")); return }
      setSubmitted(true)
    } finally {
      setSaving(false)
    }
  }

  const label = "text-sm font-semibold text-slate-900"
  const input = "w-full rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16 lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        <SermonSidebar userId={userId} />
        <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 lg:py-12">
          {submitted ? (
            <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
              <h1 className="mt-4 text-xl font-semibold text-slate-900">{tr("ስብከቱ ገብቷል!", "Sermon submitted!")}</h1>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {tr("ከተገመገመ በኋላ ይወጣል። እናመሰግናለን!", "Your sermon has been submitted and is pending review. Thank you!")}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link href="/sermons/my-sermons" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">{tr("እርስዎ ያስገቧቸው ስብከቶች", "View my sermons")}</Link>
                <button
                  onClick={() => { setSubmitted(false); setVideoInput(""); setPreacher(""); setDescription(""); setTopicIds([]) }}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  {tr("ሌላ ያስገቡ", "Add another")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{tr("አዲስ ስብከት", "Add new sermon")}</h1>
              <p className="mt-1 text-sm text-slate-500">{tr("ለግምገማ የዩቲዩብ ስብከት ያስገቡ", "Submit a YouTube sermon for review")}</p>

              <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:p-7">
                <div className="space-y-6">
                  {/* Video */}
                  <div>
                    <label htmlFor="video-url" className={label}>{tr("የዩቲዩብ ሊንክ", "YouTube URL")}</label>
                    <div className="relative mt-2">
                      <Youtube className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="video-url"
                        value={videoInput}
                        onChange={e => setVideoInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=…"
                        className={`${input} pl-9`}
                        autoComplete="off"
                      />
                    </div>
                    {videoInput.trim() && !videoId && <p className="mt-2 text-xs text-rose-600">{tr("ትክክለኛ የዩቲዩብ ሊንክ አይደለም።", "Not a YouTube link.")}</p>}
                    {videoId && (
                      <div className="mt-3 flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" className="aspect-video w-32 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200" />
                      </div>
                    )}
                  </div>

                  {/* Language */}
                  <div>
                    <p className={label}>{tr("ቋንቋ", "Language")}</p>
                    <div className="mt-2 inline-flex rounded-xl bg-slate-100 p-1">
                      {languages.map(l => {
                        const on = languageIds.includes(l.id)
                        return (
                          <button type="button" key={l.id} onClick={() => setLanguageIds([l.id])} aria-pressed={on}
                            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${on ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                            {l.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Preacher */}
                  <div>
                    <label htmlFor="preacher" className={label}>{tr("ሰባኪ", "Preacher")}</label>
                    <input id="preacher" value={preacher} onChange={e => setPreacher(e.target.value)} placeholder={tr("የሰባኪው ስም (አማራጭ)", "Preacher name (optional)")} className={`${input} mt-2`} />
                  </div>

                  {/* Topics */}
                  {topics.length > 0 && (
                    <div>
                      <p className={label}>{tr("ርዕሶች", "Topics")} <span className="font-normal text-slate-400">{tr("(አማራጭ፣ እስከ 3)", "(optional, up to 3)")}</span></p>
                      <div className="mt-2"><TopicChooser topics={topics} value={topicIds} onChange={setTopicIds} am={am} max={MAX_TOPICS} /></div>
                    </div>
                  )}

                  {/* Description, only if wanted */}
                  {showDescription ? (
                    <div>
                      <label htmlFor="description" className={label}>{tr("መግለጫ", "Description")}</label>
                      <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} autoFocus
                        placeholder={tr("ስለ ስብከቱ አጭር መግለጫ…", "Brief description of the sermon…")} className={`${input} mt-2 resize-none`} />
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowDescription(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                      <Plus className="h-4 w-4" /> {tr("መግለጫ ጨምር", "Add a description")}
                    </button>
                  )}
                </div>

                {error && <p className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

                <div className="mt-7 flex justify-end gap-2 border-t border-slate-100 pt-5">
                  <Link href="/sermons/my-sermons" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">{tr("ይቅር", "Cancel")}</Link>
                  <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 cursor-pointer">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} {tr("አስገባ", "Submit sermon")}
                  </button>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
