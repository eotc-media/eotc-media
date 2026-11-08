"use client"

import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { LocaleProvider } from "@/lib/i18n/LocaleContext"

export function Providers({ children }: { children: React.ReactNode }) {
  // The service worker makes the site installable as an app and receives
  // reading plan reminders (public/sw.js).
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {})
  }, [])

  return (
    <SessionProvider>
      <LocaleProvider>
        {children}
      </LocaleProvider>
    </SessionProvider>
  )
}
