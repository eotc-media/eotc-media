"use client"

import { useEffect, useState } from "react"

/**
 * Suggestions for a Submit form from the video whose id is given: fetched a
 * moment after the link is pasted, once per video.
 */
export function useVideoSuggestion<T>(kind: "sermons" | "hymns", videoId: string) {
  const [state, setState] = useState<{ videoId: string; loading: boolean; data: T | null }>({ videoId: "", loading: false, data: null })

  useEffect(() => {
    if (!videoId) return
    let live = true
    const timer = setTimeout(() => {
      setState({ videoId, loading: true, data: null })
      fetch(`/api/${kind}/suggest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ video: videoId }) })
        .then(r => (r.ok ? r.json() : null))
        .catch(() => null)
        .then(data => { if (live) setState({ videoId, loading: false, data }) })
    }, 500)
    return () => { live = false; clearTimeout(timer) }
  }, [kind, videoId])

  // A suggestion for an earlier link does not count for this one.
  return state.videoId === videoId ? state : { videoId, loading: !!videoId, data: null as T | null }
}
