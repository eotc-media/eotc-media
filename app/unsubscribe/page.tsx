"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Suspense } from "react"

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // Only flag a missing token up front — unsubscribing itself waits for an
  // explicit click, so an accidental tap (or a link-scanning bot) can't remove
  // someone from the list.
  useEffect(() => {
    if (!token) { setStatus("error"); setErrorMsg("Invalid unsubscribe link.") }
  }, [token])

  function confirmUnsubscribe() {
    if (!token) return
    setStatus("loading")
    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) setStatus("done")
        else { setStatus("error"); setErrorMsg(data.error ?? "Something went wrong.") }
      })
      .catch(() => { setStatus("error"); setErrorMsg("Network error. Please try again.") })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <p className="text-lg font-bold text-gray-800 mb-8">EOTC Media</p>

        {status === "idle" && (
          <>
            <p className="text-lg font-semibold text-gray-800 mb-2">Unsubscribe from emails?</p>
            <p className="text-sm text-gray-500 mb-1">
              You will no longer receive emails from EOTC Media.
            </p>
            <p className="text-xs text-gray-400 mb-7" dir="auto">
              ከEOTC Media ኢሜይሎች መውጣት ይፈልጋሉ?
            </p>
            <button
              onClick={confirmUnsubscribe}
              className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Yes, unsubscribe me
            </button>
            <a
              href="/"
              className="block mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </a>
          </>
        )}
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Processing your request…</p>
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-2">Unsubscribed</p>
            <p className="text-gray-500 text-sm">You will no longer receive emails from EOTC Media.</p>
            <p className="text-gray-400 text-xs mt-4">ከEOTC Media ኢሜይሎች ተወግደዋል።</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-2">Link invalid</p>
            <p className="text-gray-500 text-sm">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  )
}
