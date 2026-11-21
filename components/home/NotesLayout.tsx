"use client"

import { useSyncExternalStore } from "react"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { useTr } from "./shared"

// Whether the note beside a reading is hidden, remembered on this device and
// shared by the plan day page and the book reader.
const KEY = "reading_notes_hidden"
const read = () => { try { return localStorage.getItem(KEY) === "1" } catch { return false } }
const subscribe = (onChange: () => void) => {
  window.addEventListener(KEY, onChange)
  window.addEventListener("storage", onChange)
  return () => { window.removeEventListener(KEY, onChange); window.removeEventListener("storage", onChange) }
}
function setHidden(hidden: boolean) {
  try { localStorage.setItem(KEY, hidden ? "1" : "0") } catch {}
  window.dispatchEvent(new Event(KEY))
}

/** The reading with its note beside it; the note can be hidden, and the
 *  reading then takes the whole width. */
export default function NotesLayout({ children, note }: { children: React.ReactNode; note: React.ReactNode }) {
  const { tr } = useTr()
  const hidden = useSyncExternalStore(subscribe, read, () => false)

  return (
    <div className="mt-8">
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setHidden(!hidden)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
        >
          {hidden
            ? <><PanelRightOpen className="h-4 w-4" /> {tr("ማስታወሻ አሳይ", "Show notes")}</>
            : <><PanelRightClose className="h-4 w-4" /> {tr("ማስታወሻ ደብቅ", "Hide notes")}</>}
        </button>
      </div>
      <div className={hidden ? "" : "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8"}>
        <div className="min-w-0">{children}</div>
        {!hidden && <aside className="lg:sticky lg:top-24">{note}</aside>}
      </div>
    </div>
  )
}
