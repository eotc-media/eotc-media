"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { useLocale } from "@/lib/i18n/LocaleContext"

interface Props {
  language: string
  version: string
  className?: string
  variant?: "icon" | "pill"
}

type State = "idle" | "listening" | "processing" | "error"

// Hard cap — safety net if silence detection never fires (very noisy room).
const MAX_RECORDING_MS = 8000
// Once speech has been detected, stop after this much continuous quiet.
const SILENCE_MS = 1500
// Sample the room's ambient level before arming detection.
const CALIBRATION_MS = 300
// Speech must be this many times louder than the measured ambient noise...
const NOISE_MULTIPLIER = 2.5
// ...and at least this loud in absolute terms, so a silent room doesn't arm on hiss.
const MIN_SPEECH_RMS = 0.015
// How often to measure the level.
const VAD_TICK_MS = 100
// Give up on the server round-trip rather than spinning forever. Comfortably
// longer than the route's own model timeout, so its error message wins first.
const REQUEST_TIMEOUT_MS = 20000
// Clear a failure message on its own so the control returns to a usable state.
const ERROR_AUTO_CLEAR_MS = 5000

export default function VoiceNavigateButton({ language, version, className = "", variant = "icon" }: Props) {
  const router = useRouter()
  const { t } = useLocale()
  const [uiState, setUiState] = useState<State>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const stateRef = useRef<State>("idle")
  const recorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Tear down the timers and audio-analysis graph; safe to call repeatedly.
  const stopAudioWatchers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }, [])

  // Release the mic if the user navigates away mid-recording
  useEffect(() => stopAudioWatchers, [stopAudioWatchers])

  // Don't leave the button parked in the error state
  useEffect(() => {
    if (uiState !== "error") return
    const id = setTimeout(() => {
      stateRef.current = "idle"
      setUiState("idle")
      setErrorMsg("")
    }, ERROR_AUTO_CLEAR_MS)
    return () => clearTimeout(id)
  }, [uiState])

  const startListening = useCallback(async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access failed"
      setErrorMsg(
        msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("notallowed")
          ? "Microphone access denied."
          : `[mic] ${msg}`
      )
      stateRef.current = "error"
      setUiState("error")
      return
    }

    const mimeType =
      ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find(
        (t) => MediaRecorder.isTypeSupported(t)
      ) ?? ""
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

    recorder.onstop = async () => {
      stopAudioWatchers()
      stream.getTracks().forEach((t) => t.stop())
      if (stateRef.current !== "listening") return

      stateRef.current = "processing"
      setUiState("processing")

      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
      try {
        const fd = new FormData()
        fd.append("audio", blob, "recording")
        fd.append("language", language)
        fd.append("version", version)

        const controller = new AbortController()
        const abortTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
        let res: Response
        try {
          res = await fetch("/api/bible/voice-navigate", {
            method: "POST",
            body: fd,
            signal: controller.signal,
          })
        } finally {
          clearTimeout(abortTimer)
        }
        const data = await res.json()
        if (res.ok && data.url) {
          stateRef.current = "idle"
          setUiState("idle")
          router.push(data.url)
        } else {
          setErrorMsg(data.error ?? "Could not understand the reference")
          stateRef.current = "error"
          setUiState("error")
        }
      } catch (err) {
        const timedOut = err instanceof DOMException && err.name === "AbortError"
        setErrorMsg(
          timedOut
            ? (language === "amharic" ? "ጊዜው አልፏል። እንደገና ይሞክሩ።" : "Took too long. Please try again.")
            : err instanceof Error ? err.message : "Connection error"
        )
        stateRef.current = "error"
        setUiState("error")
      }
    }

    recorder.start()
    stateRef.current = "listening"
    setUiState("listening")
    recorderRef.current = recorder

    timerRef.current = setTimeout(() => {
      if (recorder.state === "recording") recorder.stop()
    }, MAX_RECORDING_MS)

    // ── Silence detection ────────────────────────────────────────────────
    // Tap the same mic stream with an AnalyserNode and watch the RMS level:
    // once the user has actually started speaking, stop as soon as they've
    // been quiet for SILENCE_MS instead of always waiting out the full cap.
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioCtx = new Ctor()
      audioCtxRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 1024
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)

      const startedAt = Date.now()
      let noiseFloor = 0
      let calibrationSamples = 0
      let hasSpoken = false
      let lastLoudAt = Date.now()

      vadIntervalRef.current = setInterval(() => {
        if (stateRef.current !== "listening") return

        analyser.getByteTimeDomainData(buf)
        let sumSquares = 0
        for (let i = 0; i < buf.length; i++) {
          const deviation = (buf[i] - 128) / 128
          sumSquares += deviation * deviation
        }
        const rms = Math.sqrt(sumSquares / buf.length)

        // Learn the ambient level first so noisy rooms get a higher bar
        if (Date.now() - startedAt < CALIBRATION_MS) {
          noiseFloor = (noiseFloor * calibrationSamples + rms) / (calibrationSamples + 1)
          calibrationSamples++
          return
        }

        const threshold = Math.max(noiseFloor * NOISE_MULTIPLIER, MIN_SPEECH_RMS)
        if (rms > threshold) {
          hasSpoken = true
          lastLoudAt = Date.now()
        } else if (hasSpoken && Date.now() - lastLoudAt > SILENCE_MS) {
          if (recorder.state === "recording") recorder.stop()
        }
      }, VAD_TICK_MS)
    } catch {
      // Web Audio unavailable — fall back to the fixed cap / manual tap-to-stop
    }
  }, [language, version, router, stopAudioWatchers])

  function handleClick() {
    if (uiState === "listening") {
      stopAudioWatchers()
      if (recorderRef.current?.state === "recording") recorderRef.current.stop()
    } else if (uiState !== "processing") {
      setErrorMsg("")
      startListening()
    }
  }

  const isListening = uiState === "listening"
  const isProcessing = uiState === "processing"
  const isError = uiState === "error"

  if (variant === "pill") {
    const popupText =
      isListening  ? (language === "amharic" ? "እየሰማ ነው…" : "Listening…") :
      isProcessing ? (language === "amharic" ? "እየፈለገ ነው…" : "Processing…") :
      isError      ? errorMsg : null
    return (
      <div className="relative flex-shrink-0">
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-medium transition-all ${
            isListening  ? "bg-red-500 text-white animate-pulse" :
            isProcessing ? "bg-blue-500 text-white" :
            isError      ? "bg-amber-50 text-amber-700 border border-amber-200" :
                           "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          } ${className}`}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
          ) : isListening ? (
            <MicOff className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Mic className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate">{t("bible_voice_search")}</span>
        </button>

        {popupText && (
          <div
            className="absolute top-full left-0 mt-1.5 z-50 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap leading-snug"
            style={{ background: isListening ? "#dc2626" : isProcessing ? "#2563eb" : "#1e293b", color: "#fff" }}
          >
            {popupText}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        title={language === "amharic" ? "በድምጽ ምዕራፍ ፈልግ" : "Navigate by voice"}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0 ${
          isListening  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" :
          isProcessing ? "bg-blue-500 text-white" :
          isError      ? "bg-amber-100 text-amber-600 hover:bg-amber-200" :
                         "text-blue-600 bg-blue-100 hover:bg-blue-200"
        } ${className}`}
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-3.5 h-3.5" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {(isListening || isProcessing || isError) && (
        <div
          className="absolute top-full right-0 mt-1.5 z-50 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none max-w-[220px] text-right leading-snug"
          style={{ background: isListening ? "#dc2626" : isProcessing ? "#2563eb" : "#1e293b", color: "#fff" }}
        >
          {isListening  && (language === "amharic" ? "እየሰማ ነው…" : "Listening…")}
          {isProcessing && (language === "amharic" ? "እየፈለገ ነው…" : "Processing…")}
          {isError      && errorMsg}
        </div>
      )}
    </div>
  )
}
