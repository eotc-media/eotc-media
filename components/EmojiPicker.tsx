"use client"

import { useEffect, useRef, useState } from "react"
import { Smile } from "lucide-react"

// A curated set rather than an emoji-picker package. The published libraries
// ship the full Unicode table plus sprite sheets — over a megabyte of client
// bundle — to solve a problem this app does not have: people write short
// responses to hymns, and a couple of dozen well-chosen characters cover what
// they reach for. Everything here is also typeable from a phone keyboard; the
// picker exists for people on a desktop.
const GROUPS: { label: string; emoji: string[] }[] = [
  {
    label: "Praise",
    emoji: ["🙏", "✝️", "🕊️", "🌿", "🔥", "✨", "🙌", "👑", "🕯️", "📖"],
  },
  {
    label: "Heart",
    emoji: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "💖", "💝", "♥️"],
  },
  {
    label: "Faces",
    emoji: ["😊", "🥰", "😇", "🙂", "😌", "😢", "🥹", "😭", "🤗", "😴"],
  },
  {
    label: "More",
    emoji: ["👍", "👏", "💪", "🎵", "🎶", "⭐", "🌟", "💫", "🌸", "🇪🇹"],
  },
]

export default function EmojiPicker({
  onSelect,
  disabled,
}: {
  onSelect: (emoji: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on an outside click or Escape, the two things people try first.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("touchstart", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("touchstart", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        // Inside a form, an unqualified button submits it.
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-label="Add emoji"
        aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <Smile className="w-5 h-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Emoji"
          // Opens upward: the comment box sits low on the page, and a panel
          // below it would fall off the bottom on a phone.
          className="absolute bottom-full right-0 mb-2 z-50 w-[17rem] max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          {GROUPS.map(group => (
            <div key={group.label} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emoji.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      onSelect(e)
                      setOpen(false)
                    }}
                    aria-label={e}
                    className="flex items-center justify-center h-8 w-8 rounded-lg text-lg leading-none hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
