"use client"

import { useSyncExternalStore } from "react"

// The page a reader reached in a book's PDF, kept on their device.
export const pdfPageKey = (slug: string) => `pdf-page:${slug}`

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange)
  return () => window.removeEventListener("storage", onChange)
}

/** The page to continue from, if the reader has gone past the first. */
export function useSavedPdfPage(slug: string): number | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      try { const n = Number(localStorage.getItem(pdfPageKey(slug))); return n > 1 ? n : null } catch { return null }
    },
    () => null,
  )
}
