"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { useTr } from "./shared"

type State = "loading" | "off" | "on" | "blocked" | "install-first" | "unsupported"

// A phone browser on iOS only allows notifications for a site added to the Home
// Screen; elsewhere the browser itself can receive them.
function isIosBrowserTab() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const standalone = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return ios && !standalone
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

/** "Remind me in the evening": web push for the reading plan, per browser. */
export default function ReminderToggle() {
  const { am, tr } = useTr()
  const [state, setState] = useState<State>("loading")
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    let cancelled = false
    const settle = (s: State) => { if (!cancelled) setState(s) }
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    if (!publicKey) settle("unsupported")
    else if (!supported) settle(isIosBrowserTab() ? "install-first" : "unsupported")
    else if (Notification.permission === "denied") settle("blocked")
    else navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => settle(sub ? "on" : "off"))
      .catch(() => settle("off"))
    return () => { cancelled = true }
  }, [publicKey])

  async function turnOn() {
    setState("loading")
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("blocked")
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
        ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey!) })
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: am ? "am" : "en",
        }),
      })
      setState(res.ok ? "on" : "off")
    } catch {
      setState("off")
    }
  }

  async function turnOff() {
    setState("loading")
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
    } finally {
      setState("off")
    }
  }

  if (state === "unsupported") return null

  const note = {
    "install-first": tr("ማሳሰቢያ ለማግኘት ይህን ገጽ በ Safari «Share» → «Add to Home Screen» ወደ መነሻ ገጽዎ ያክሉ።", "To get reminders on iPhone, add this site to your Home Screen (Share → Add to Home Screen)."),
    blocked: tr("ማሳወቂያዎች በአሳሽዎ ታግደዋል፤ ከአሳሹ ቅንብሮች ይፍቀዱ።", "Notifications are blocked for this site; allow them in your browser settings."),
  }[state as "install-first" | "blocked"]

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        {state === "on" ? <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" /> : <BellOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">{tr("የምሽት ማሳሰቢያ", "Evening reminder")}</p>
          <p className="text-xs text-slate-500">
            {note ?? tr("ያልተነበበ ንባብ ካለ ከምሽቱ 4 ሰዓት ላይ እናሳስብዎታለን።", "If today's reading is still unread, we'll remind you at 10 pm.")}
          </p>
        </div>
      </div>
      {(state === "on" || state === "off" || state === "loading") && (
        <button
          role="switch"
          aria-checked={state === "on"}
          aria-label={tr("የምሽት ማሳሰቢያ", "Evening reminder")}
          disabled={state === "loading"}
          onClick={state === "on" ? turnOff : turnOn}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60 ${state === "on" ? "bg-blue-600" : "bg-slate-300"}`}
        >
          {state === "loading"
            ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-white" />
            : <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${state === "on" ? "translate-x-5" : "translate-x-0.5"}`} />}
        </button>
      )}
    </div>
  )
}
