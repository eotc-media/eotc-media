"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Loader2, Minus, Plus } from "lucide-react"
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist"
import { useTr } from "@/components/home/shared"
import { pdfPageKey } from "./pdf-progress"

/**
 * A book's PDF, read in the page: pages one under another, drawn only when
 * near the screen (a 400-page book stays light), at the width of the screen.
 * The last page read is remembered on this device.
 */
export default function PdfReader({ slug, name, urls, download }: {
  slug: string
  name: string
  /** Where the PDF can be fetched, tried in order (R2's own domain first). */
  urls: string[]
  download: string
}) {
  const { tr } = useTr()
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [failed, setFailed] = useState(false)
  const [ratio, setRatio] = useState(1.414) // height / width of the first page
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState(0)
  const [page, setPage] = useState(1)
  const [jump, setJump] = useState("")
  const box = useRef<HTMLDivElement>(null)
  const restored = useRef(false)

  // Open the document.
  useEffect(() => {
    let cancelled = false
    let opened: { destroy: () => Promise<void> } | null = null
    ;(async () => {
      const pdfjs = await import("pdfjs-dist")
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
      for (const url of urls) {
        try {
          const task = pdfjs.getDocument({ url, disableAutoFetch: true })
          opened = task
          const d = await task.promise
          if (cancelled) return
          const first = (await d.getPage(1)).getViewport({ scale: 1 })
          setRatio(first.height / first.width)
          setDoc(d)
          return
        } catch {
          // Try the next address (a CORS refusal, a missing file…).
        }
      }
      if (!cancelled) setFailed(true)
    })()
    return () => { cancelled = true; void opened?.destroy() }
  }, [urls])

  // The column's width, followed as the window changes.
  useEffect(() => {
    const el = box.current
    if (!el) return
    // The content width, inside the padding, so a page never overflows the screen.
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pageWidth = Math.round(Math.min(width, 860) * zoom)

  // Back to where the reader stopped, once the pages have their size.
  useEffect(() => {
    if (!doc || !pageWidth || restored.current) return
    restored.current = true
    let saved = 0
    try { saved = Number(localStorage.getItem(pdfPageKey(slug))) || 0 } catch {}
    if (saved > 1 && saved <= doc.numPages) {
      requestAnimationFrame(() => document.getElementById(`pdf-page-${saved}`)?.scrollIntoView())
    }
  }, [doc, pageWidth, slug])

  // Which page is on screen, and remembering it.
  const visible = useRef(new Map<number, number>())
  const onVisible = useCallback((n: number, share: number) => {
    if (share > 0) visible.current.set(n, share)
    else visible.current.delete(n)
    let best = 0, top = 0
    visible.current.forEach((s, k) => { if (s > best) { best = s; top = k } })
    if (top) setPage(top)
  }, [])
  useEffect(() => {
    if (!restored.current) return
    const t = setTimeout(() => { try { localStorage.setItem(pdfPageKey(slug), String(page)) } catch {} }, 400)
    return () => clearTimeout(t)
  }, [page, slug])

  function goTo(e: React.FormEvent) {
    e.preventDefault()
    const n = Math.min(Math.max(1, parseInt(jump) || page), doc?.numPages ?? 1)
    document.getElementById(`pdf-page-${n}`)?.scrollIntoView()
    setJump("")
  }

  const zoomBy = (d: number) => setZoom(z => Math.min(2.5, Math.max(0.5, Math.round((z + d) * 10) / 10)))

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Link href={`/books/${encodeURIComponent(slug)}`} className="flex flex-shrink-0 items-center gap-1.5 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={tr("ወደ መጽሐፉ", "Back to the book")}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{name}</p>

          {doc && (
            <form onSubmit={goTo} className="flex flex-shrink-0 items-center gap-1 text-sm text-slate-500 tabular-nums">
              <input
                value={jump}
                onChange={e => setJump(e.target.value.replace(/\D/g, ""))}
                onBlur={() => setJump("")}
                placeholder={String(page)}
                inputMode="numeric"
                aria-label={tr("ገጽ", "Page")}
                className="w-11 rounded-md bg-slate-100 px-1.5 py-1 text-center text-slate-900 placeholder:text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span>/ {doc.numPages}</span>
            </form>
          )}

          <div className="hidden flex-shrink-0 items-center rounded-lg bg-slate-100 p-0.5 sm:flex">
            <button onClick={() => zoomBy(-0.1)} className="rounded-md p-1.5 text-slate-600 hover:bg-white cursor-pointer" aria-label={tr("አሳንስ", "Zoom out")}><Minus className="h-3.5 w-3.5" /></button>
            <button onClick={() => setZoom(1)} className="w-12 rounded-md py-1 text-xs font-semibold text-slate-600 tabular-nums hover:bg-white cursor-pointer">{Math.round(zoom * 100)}%</button>
            <button onClick={() => zoomBy(0.1)} className="rounded-md p-1.5 text-slate-600 hover:bg-white cursor-pointer" aria-label={tr("አስፋ", "Zoom in")}><Plus className="h-3.5 w-3.5" /></button>
          </div>
          <a href={download} download className="flex flex-shrink-0 items-center gap-1.5 rounded-lg p-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={tr("አውርድ", "Download")}>
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span>
          </a>
        </div>
      </div>

      <div ref={box} className="mx-auto max-w-5xl overflow-x-auto px-2 py-6 sm:px-6">
        {failed ? (
          <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <p className="font-semibold text-slate-900">{tr("መጽሐፉን እዚህ መክፈት አልተቻለም", "This book couldn't be opened here")}</p>
            <p className="mt-1 text-sm text-slate-500">{tr("ፋይሉን አውርደው ማንበብ ይችላሉ።", "You can still download the PDF and read it.")}</p>
            <a href={download} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              <Download className="h-4 w-4" /> {tr("PDF አውርድ", "Download PDF")}
            </a>
          </div>
        ) : !doc || !pageWidth ? (
          <div className="flex flex-col items-center gap-3 py-24 text-sm text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            {tr("መጽሐፉ እየተከፈተ ነው…", "Opening the book…")}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4" style={{ minWidth: pageWidth }}>
            {Array.from({ length: doc.numPages }, (_, i) => (
              <PdfPage key={i + 1} doc={doc} number={i + 1} width={pageWidth} ratio={ratio} onVisible={onVisible} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** One page: a sized placeholder, drawn when it comes near the screen and
 *  cleared again when far away. */
function PdfPage({ doc, number, width, ratio, onVisible }: {
  doc: PDFDocumentProxy
  number: number
  width: number
  ratio: number
  onVisible: (n: number, share: number) => void
}) {
  const holder = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(false)
  const [height, setHeight] = useState(Math.round(width * ratio))

  useEffect(() => {
    const el = holder.current
    if (!el) return
    const nearObs = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "1500px 0px" })
    const seenObs = new IntersectionObserver(([e]) => onVisible(number, e.isIntersecting ? e.intersectionRatio : 0), { threshold: [0, 0.25, 0.5, 0.75, 1] })
    nearObs.observe(el)
    seenObs.observe(el)
    return () => { nearObs.disconnect(); seenObs.disconnect(); onVisible(number, 0) }
  }, [number, onVisible])

  useEffect(() => {
    if (!near) return
    let task: RenderTask | null = null
    let cancelled = false
    ;(async () => {
      const page = await doc.getPage(number)
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: width / base.width })
      setHeight(Math.round(viewport.height))
      const c = canvas.current
      if (!c) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = Math.floor(viewport.width * dpr)
      c.height = Math.floor(viewport.height * dpr)
      task = page.render({ canvas: c, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined })
      await task.promise.catch(() => {})
    })()
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [near, doc, number, width])

  return (
    <div
      ref={holder}
      id={`pdf-page-${number}`}
      className="relative scroll-mt-32 bg-white shadow-sm ring-1 ring-slate-200"
      style={{ width, height }}
    >
      {near ? (
        <canvas ref={canvas} className="block h-full w-full" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-300 tabular-nums">{number}</span>
      )}
    </div>
  )
}
