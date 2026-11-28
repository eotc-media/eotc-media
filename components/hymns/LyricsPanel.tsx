"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import {
  Music, Sparkles, Pencil, Plus, X, Check, RefreshCw, Loader2, Clock,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Minus, Undo2, Redo2,
} from "lucide-react"
import { errorMessageFrom } from "@/lib/response-error"

interface LyricsPanelProps {
  lyrics: string | null
  lyricsSuggestion: string | null
  aiLyrics: string | null
  hymnId: number
  userId?: number
}

function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition-colors cursor-pointer ${active ? "bg-slate-300 text-slate-900" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
    >
      {children}
    </button>
  )
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 border-b border-slate-200 bg-slate-50/80">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-slate-300 mx-0.5" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <List className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-slate-300 mx-0.5" />
      <ToolbarBtn onClick={() => editor.chain().focus().setHardBreak().run()} title="Line break (Shift+Enter)">
        <span className="text-xs font-mono leading-none">↵</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <Minus className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <div className="w-px h-4 bg-slate-300 mx-0.5" />
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo2 className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo2 className="w-3.5 h-3.5" />
      </ToolbarBtn>
    </div>
  )
}

function LyricsEditor({
  initialContent,
  onSave,
  onCancel,
}: {
  initialContent: string
  onSave: (html: string) => Promise<void>
  onCancel: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, code: false, blockquote: false }),
      Placeholder.configure({ placeholder: "Enter lyrics… (Shift+Enter = line break within verse, Enter = new verse)" }),
      Underline,
    ],
    content: initialContent || "<p></p>",
    editorProps: {
      attributes: {
        class: "min-h-[220px] px-3 py-2 text-slate-800 text-sm leading-relaxed focus:outline-none font-serif [&_p]:mb-2 [&_hr]:my-2 [&_hr]:border-slate-300",
      },
    },
  })

  const handleSave = useCallback(async () => {
    if (!editor) return
    const html = editor.getHTML()
    if (!editor.getText().trim()) { setError("Please enter lyrics"); return }
    setSaving(true)
    setError(null)
    try {
      await onSave(html)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setSaving(false)
    }
  }, [editor, onSave])

  return (
    <div className="mb-3">
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Check className="w-3 h-3" /> {saving ? "Saving…" : "Submit for review"}
        </button>
      </div>
    </div>
  )
}

// Keeps its own copy of the suggestion and AI lyrics (they change as a member
// edits or generates), seeded from props once. Render it with key={hymnId} so a
// different hymn gets a fresh panel instead of the previous hymn's text.
export default function LyricsPanel({ lyrics, lyricsSuggestion, aiLyrics, hymnId, userId }: LyricsPanelProps) {
  const [editing, setEditing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [genProgress, setGenProgress] = useState(0)
  const genIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localSuggestion, setLocalSuggestion] = useState<string | null>(lyricsSuggestion)
  const [localAiLyrics, setLocalAiLyrics] = useState<string | null>(aiLyrics)

  const isLoggedIn = !!userId

  const GEN_STEPS = ["Listening to the hymn…", "Writing the lyrics…", "Checking the words…", "Almost done…"]

  const startProgress = () => {
    setGenStep(0)
    setGenProgress(5)
    let step = 0
    let progress = 5
    genIntervalRef.current = setInterval(() => {
      progress = Math.min(progress + (step < 2 ? 4 : 2), 88)
      if (step < GEN_STEPS.length - 1 && progress > (step + 1) * 22) step++
      setGenProgress(progress)
      setGenStep(step)
    }, 600)
  }

  const stopProgress = () => {
    if (genIntervalRef.current) clearInterval(genIntervalRef.current)
    genIntervalRef.current = null
    setGenProgress(100)
    setTimeout(() => { setGenProgress(0); setGenStep(0) }, 500)
  }

  useEffect(() => () => { if (genIntervalRef.current) clearInterval(genIntervalRef.current) }, [])

  // Save to lyricsSuggestion — aiLyrics is left untouched
  const handleSave = useCallback(async (html: string) => {
    const res = await fetch(`/api/hymns/${hymnId}/suggest-lyrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyrics: html }),
    })
    if (!res.ok) throw new Error(await errorMessageFrom(res, "Failed to save"))
    setLocalSuggestion(html)
    setEditing(false)
  }, [hymnId])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    startProgress()
    try {
      const res = await fetch(`/api/hymns/${hymnId}/generate-lyrics`, { method: "POST" })
      if (!res.ok) throw new Error(await errorMessageFrom(res, "Failed to generate"))
      const data = await res.json()
      stopProgress()
      setLocalAiLyrics(data.lyrics)
    } catch (e: unknown) {
      stopProgress()
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setGenerating(false)
    }
  }

  // Determine display state
  // Priority: approved lyrics > lyricsSuggestion > aiLyrics > empty
  const allEmpty = !lyrics && !localSuggestion && !localAiLyrics

  // Pre-fill editor: suggestion first (user's last edit), then aiLyrics (as starting point), then approved lyrics
  const editorInitialContent = localSuggestion ?? localAiLyrics ?? lyrics ?? ""

  // The AI lyrics are what is shown (no approved lyrics, no member's edit).
  const showingAi = !lyrics && !localSuggestion && !!localAiLyrics

  const genButton = (label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={generating}
      className="relative flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-80 cursor-pointer overflow-hidden"
    >
      {generating && (
        <span
          className="absolute inset-0 bg-blue-200/60 transition-all duration-500 ease-out origin-left"
          style={{ transform: `scaleX(${genProgress / 100})` }}
        />
      )}
      <span className="relative flex items-center gap-1">
        {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
        {generating ? GEN_STEPS[genStep] : label}
      </span>
    </button>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">ግጥም</h2>
        </div>

        {isLoggedIn && !editing && (
          <div className="flex items-center gap-1.5">
            {/* When all empty: show both Generate + Add */}
            {allEmpty && (
              <>
                {genButton("Generate with AI", <Sparkles className="w-3 h-3" />)}
                <button
                  type="button"
                  onClick={() => { setError(null); setEditing(true) }}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add lyrics
                </button>
              </>
            )}

            {/* AI lyrics on show: they can be written again */}
            {showingAi && genButton("Regenerate", <RefreshCw className="w-3 h-3" />)}

            {/* When aiLyrics or suggestion or lyrics exist: show Edit button */}
            {!allEmpty && (
              <button
                type="button"
                onClick={() => { setError(null); setEditing(true) }}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {editing && (
        <LyricsEditor
          initialContent={editorInitialContent}
          onSave={handleSave}
          onCancel={() => { setEditing(false); setError(null) }}
        />
      )}

      {!editing && (
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 12rem)", scrollbarWidth: "thin" }}>
          {lyrics ? (
            // Approved lyrics
            <div
              className="font-serif text-sm leading-relaxed text-slate-700 [&_p]:mb-2 [&_hr]:my-3 [&_hr]:border-slate-200"
              dangerouslySetInnerHTML={{ __html: lyrics }}
            />
          ) : localSuggestion ? (
            // User suggestion pending review
            <>
              <Notice tone="amber" icon={<Clock className="h-3.5 w-3.5" />} title="ለግምገማ ቀርቧል" text="ያስተካከሉት ግጥም በአስተዳዳሪ እስኪጸድቅ እየጠበቀ ነው።" />
              <div
                className="font-serif text-sm leading-relaxed text-slate-600 [&_p]:mb-2 [&_hr]:my-3 [&_hr]:border-slate-200"
                dangerouslySetInnerHTML={{ __html: localSuggestion }}
              />
            </>
          ) : localAiLyrics ? (
            // AI-generated lyrics awaiting user review/edit
            <>
              <Notice tone="blue" icon={<Sparkles className="h-3.5 w-3.5" />} title="በ AI የተጻፈ" text={<>ስህተት ካዩ «Edit» ተጭነው በማስተካከል ያግዙን።</>} />
              <div
                className="font-serif text-sm leading-relaxed text-slate-600 [&_p]:mb-2 [&_hr]:my-3 [&_hr]:border-slate-200"
                dangerouslySetInnerHTML={{ __html: localAiLyrics }}
              />
            </>
          ) : (
            // Truly empty
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Music className="w-8 h-8 mb-2 opacity-20" strokeWidth={1.5} />
              <p className="text-xs font-medium">Lyrics not yet available</p>
              {!isLoggedIn && (
                <p className="text-xs mt-0.5 text-slate-300">Sign in to add or generate lyrics</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** A small note above the lyrics: where they come from. */
function Notice({ tone, icon, title, text }: { tone: "blue" | "amber"; icon: React.ReactNode; title: string; text: React.ReactNode }) {
  const tile = tone === "blue" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-700"
  return (
    <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200">
      <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${tile}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  )
}
