"use client"

import Link from "next/link"
import { AlertTriangle, Loader2, Sparkles } from "lucide-react"

/** Under a pasted link: the video, and whether the form was filled in from it. */
export default function VideoPreview({ videoId, title, channel, loading, filled, existingHref, am }: {
  videoId: string
  title?: string
  channel?: string
  loading: boolean
  filled: boolean
  existingHref?: string | null
  am: boolean
}) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" className="aspect-video w-32 flex-shrink-0 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200" />
        <div className="min-w-0 text-sm">
          {title && <p className="line-clamp-2 font-medium text-slate-900">{title}</p>}
          {channel && <p className="mt-0.5 truncate text-xs text-slate-500">{channel}</p>}
          {loading && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {am ? "ከቪዲዮው እየሞላ ነው…" : "Filling in from the video…"}
            </p>
          )}
          {!loading && filled && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-blue-700">
              <Sparkles className="h-3.5 w-3.5" /> {am ? "ከቪዲዮው ተሞልቷል፤ እባክዎ ያረጋግጡ።" : "Filled in from the video. Please check."}
            </p>
          )}
        </div>
      </div>
      {existingHref && (
        <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          {am ? "ይህ ቪዲዮ ቀድሞ ገብቷል።" : "This video is already on the site."}{" "}
          <Link href={existingHref} className="font-semibold underline">{am ? "ይመልከቱ" : "View it"}</Link>
        </p>
      )}
    </div>
  )
}
