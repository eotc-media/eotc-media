"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Records the browser's time zone so the server can work out the reader's own
// date and hour. On a first visit — or after travelling — it sets the cookie
// and asks once for the page again, now dated where the reader actually is.
export default function TimezoneSync() {
  const router = useRouter()
  useEffect(() => {
    let tz: string
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return }
    if (!tz) return
    const current = document.cookie.split("; ").find(c => c.startsWith("tz="))?.slice(3)
    if (current && decodeURIComponent(current) === tz) return
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [router])
  return null
}
