"use client"

import { useEffect, useRef } from "react"

/**
 * Poll `fn` every `intervalMs`, but only while the page is actually being
 * looked at.
 *
 * The quiz room and round pages both need to see what other players are doing,
 * which a plain setInterval gave them — and went on giving them to a tab left
 * open in the background for hours, and to a round that had already finished.
 * Every one of those was a serverless invocation.
 *
 * Polling stops when the tab is hidden and resumes on return, fetching once
 * immediately so the player is never looking at a stale screen while waiting
 * for the next tick. Pass `enabled: false` to stop entirely.
 */
export function usePolling(fn: () => void, intervalMs: number, enabled = true) {
  // Held in a ref so a caller re-creating the callback each render restarts the
  // timer rather than the interval being torn down and rebuilt every time.
  const fnRef = useRef(fn)
  useEffect(() => { fnRef.current = fn }, [fn])

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setInterval> | null = null

    const stop = () => {
      if (timer) { clearInterval(timer); timer = null }
    }
    const start = () => {
      if (timer) return
      timer = setInterval(() => fnRef.current(), intervalMs)
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop()
      } else {
        fnRef.current()
        start()
      }
    }

    if (!document.hidden) start()
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [intervalMs, enabled])
}
