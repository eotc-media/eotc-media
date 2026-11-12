"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import {
  X, ChevronLeft, Check, Loader2, BookOpen, ScrollText, Cross, BookHeart, Music2,
  ListChecks, Clock, CalendarDays, Sparkles, Library,
} from "lucide-react"
import { BIBLE_SECTIONS } from "@/lib/bible-sections"
import {
  PRESETS, WORDS_PER_MINUTE, addDays, daysForMinutes, daysForWorkMinutes, endDateFor, generatePlan,
  generateWorkPlan, isNewTestament, isWorkConfig, resolveTracks, versesFor,
  type AnyPlanConfig, type BookMeta, type ChapterRow, type GenerateResult, type PlanConfig, type PresetKey,
  type WorkMeta, type WorkPlanConfig,
} from "@/lib/reading-plan"
import { useTr, shortDate, longDate, readingText, selectPlan, WEEKDAY_SHORT_AM, WEEKDAY_SHORT_EN, type BookNames } from "./shared"

export const DRAFT_KEY = "eotc.readingPlanDraft"

const PRESET_ICONS: Record<PresetKey, typeof BookOpen> = {
  "whole-bible": BookOpen,
  "new-testament": Cross,
  "old-testament": ScrollText,
  gospels: BookHeart,
  "psalms-proverbs": Music2,
  custom: ListChecks,
}

const PRESET_ORDER: PresetKey[] = ["whole-bible", "new-testament", "old-testament", "gospels", "psalms-proverbs", "custom"]

const DURATIONS = [
  { days: 30, am: "30 ቀን", en: "30 days" },
  { days: 90, am: "3 ወር", en: "3 months" },
  { days: 182, am: "6 ወር", en: "6 months" },
  { days: 365, am: "1 ዓመት", en: "1 year" },
  { days: 730, am: "2 ዓመት", en: "2 years" },
]
const MINUTES = [5, 10, 15, 20, 30, 45]
// The Fathers' works are short — the longest is a few weeks at a modest pace.
const WORK_DURATIONS = [
  { days: 7, am: "1 ሳምንት", en: "1 week" },
  { days: 14, am: "2 ሳምንት", en: "2 weeks" },
  { days: 30, am: "1 ወር", en: "1 month" },
  { days: 60, am: "2 ወር", en: "2 months" },
]

export type PlanSource = "bible" | "fathers"

interface Structure { books: BookMeta[]; chapters: ChapterRow[] }

// Stable empties, so a memo keyed on them does not recompute every render
// while the structure is still loading.
const NO_BOOKS: BookMeta[] = []
const NO_CHAPTERS: ChapterRow[] = []

export default function PlanBuilder({
  open, onClose, today, signedIn, initialPreset, initialConfig, initialSource, adding = false,
}: {
  open: boolean
  onClose: () => void
  today: string
  signedIn: boolean
  initialPreset?: PresetKey
  initialConfig?: AnyPlanConfig | null
  /** Open on the Church Fathers shelf rather than the Bible. */
  initialSource?: PlanSource
  /** The reader already follows a plan: this one runs alongside it. */
  adding?: boolean
}) {
  const { am, tr } = useTr()
  const router = useRouter()

  const bibleDraft = initialConfig && !isWorkConfig(initialConfig) ? initialConfig : null
  const workDraft = initialConfig && isWorkConfig(initialConfig) ? initialConfig : null

  const [structure, setStructure] = useState<Structure | null>(null)
  const [shelf, setShelf] = useState<WorkMeta[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [source, setSource] = useState<PlanSource>(workDraft ? "fathers" : initialSource ?? "bible")
  const [workSlug, setWorkSlug] = useState<string | null>(workDraft?.work.slug ?? null)
  // Opened from a preset on the homepage, the choice is already made — go
  // straight to pace. Only "choose books" still needs the first step.
  const [step, setStep] = useState<1 | 2>(
    initialConfig || (initialPreset && initialPreset !== "custom") ? 2 : 1,
  )
  const [preset, setPreset] = useState<PresetKey>(bibleDraft?.preset ?? initialPreset ?? "whole-bible")
  const [custom, setCustom] = useState<Set<string>>(new Set(bibleDraft?.books ?? []))
  // A book of the Fathers is easiest to pace by time; the Bible by an end date.
  const [paceMode, setPaceMode] = useState<"date" | "minutes">(source === "fathers" ? "minutes" : "date")
  const [startDate, setStartDate] = useState(initialConfig?.startDate ?? today)
  const [endDate, setEndDate] = useState(
    initialConfig?.endDate ?? addDays(today, PRESETS[initialPreset && initialPreset !== "custom" ? initialPreset : "whole-bible"].days - 1),
  )
  const [minutes, setMinutes] = useState(10)
  const [rest, setRest] = useState<number[]>(initialConfig?.restWeekdays ?? [])
  const [sideBySide, setSideBySide] = useState(bibleDraft?.sideBySide ?? true)
  const [withPsalms, setWithPsalms] = useState(bibleDraft?.withPsalms ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // The builder's data is ~15 KB of chapter counts — fetched only when someone
  // actually opens it, never as part of the homepage.
  useEffect(() => {
    if (!open || source !== "bible" || structure) return
    fetch("/api/reading-plans/structure")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setStructure)
      .catch(() => setLoadError(true))
  }, [open, source, structure])

  useEffect(() => {
    if (!open || source !== "fathers" || shelf) return
    fetch("/api/reading-plans/works")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setShelf)
      .catch(() => setLoadError(true))
  }, [open, source, shelf])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  function chooseSource(s: PlanSource) {
    setSource(s)
    setPaceMode(s === "fathers" ? "minutes" : "date")
  }

  function chooseWork(slug: string) {
    setWorkSlug(slug)
    setEndDate(addDays(startDate, 13))
    setStep(2)
  }

  function choosePreset(p: PresetKey) {
    setPreset(p)
    if (p !== "custom") setEndDate(addDays(startDate, PRESETS[p].days - 1))
    if (p !== "custom") setStep(2)
  }

  const books = structure?.books ?? NO_BOOKS
  const chapters = structure?.chapters ?? NO_CHAPTERS
  const names: BookNames = useMemo(() => Object.fromEntries(books.map(b => [b.id, b])), [books])

  // In minutes-a-day mode the end date follows from the pace, not the other
  // way round.
  const config: PlanConfig = useMemo(() => {
    const base: PlanConfig = { preset, books: [...custom], sideBySide, withPsalms, startDate, endDate, restWeekdays: rest }
    if (paceMode === "date" || !structure) return base
    const days = daysForMinutes(versesFor(base, structure.books, structure.chapters), minutes)
    return { ...base, endDate: endDateFor(startDate, days, rest) }
  }, [paceMode, minutes, structure, preset, custom, sideBySide, withPsalms, startDate, endDate, rest])

  const work = shelf?.find(w => w.slug === workSlug) ?? null
  const workConfig: WorkPlanConfig | null = useMemo(() => {
    if (!work) return null
    const base: WorkPlanConfig = {
      work: { slug: work.slug, title: work.title, titleAm: work.titleAm }, startDate, endDate, restWeekdays: rest,
    }
    return paceMode === "date" ? base : { ...base, endDate: endDateFor(startDate, daysForWorkMinutes(work, minutes), rest) }
  }, [work, paceMode, minutes, startDate, endDate, rest])

  const result: GenerateResult | null = useMemo(() => {
    if (source === "fathers") return work && workConfig ? generateWorkPlan(workConfig, work) : null
    return structure ? generatePlan(config, books, chapters) : null
  }, [source, work, workConfig, config, structure, books, chapters])

  // Which options are meaningful for what is selected.
  const selectedOsis = useMemo(
    () => (structure ? resolveTracks({ ...config, sideBySide: false, withPsalms: false }, books).flatMap(t => t.osis) : []),
    [config, structure, books],
  )
  const spansBoth = selectedOsis.some(isNewTestament) && selectedOsis.some(o => !isNewTestament(o))
  const canAddPsalms = preset !== "psalms-proverbs" && selectedOsis.some(o => o !== "Ps")
  const showSideBySide = preset !== "psalms-proverbs" && spansBoth

  async function start() {
    const finalConfig: AnyPlanConfig = source === "fathers" && workConfig
      ? workConfig
      : { ...config, sideBySide: showSideBySide && sideBySide, withPsalms: canAddPsalms && withPsalms }
    if (!signedIn) {
      // Keep what they built through the sign-in round trip.
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(finalConfig)) } catch {}
      router.push(`/auth/login?callbackUrl=${encodeURIComponent("/?resume=1")}`)
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/reading-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: finalConfig }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? tr("ዕቅዱን ማስቀመጥ አልተቻለም።", "Could not save the plan.")); return }
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      // Show the new plan on the card, not whichever was showing before.
      if (typeof data.id === "number") selectPlan(data.id)
      onClose()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const presetName = (p: PresetKey) =>
    p === "custom" ? tr("መጻሕፍትን ይምረጡ", "Choose books") : am ? PRESETS[p].am : PRESETS[p].en

  // Into <body>: the plan card that opens this sits in a raised stacking
  // context, and a dialog rendered inside it could never rise above the
  // navbar or the feedback button however high its own z-index.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              aria-label={tr("ተመለስ", "Back")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              {tr(`ደረጃ ${step} ከ 2`, `Step ${step} of 2`)}
            </p>
            <h2 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
              {step === 1
                ? tr("ምን ማንበብ ይፈልጋሉ?", "What would you like to read?")
                : source === "fathers" && work ? (am ? (work.titleAm ?? work.title) : work.title) : presetName(preset)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            aria-label={tr("ዝጋ", "Close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadError && (
            <p className="m-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {tr("መረጃውን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።", "Could not load the books. Please try again.")}
            </p>
          )}

          {/* ── Step 1: what ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="px-5 py-6 sm:px-7">
              <div className="mb-5 inline-flex rounded-full bg-slate-100 p-1">
                {([
                  ["bible", BookOpen, tr("መጽሐፍ ቅዱስ", "The Bible")],
                  ["fathers", Library, tr("የቤተ ክርስቲያን አበው", "Church Fathers")],
                ] as const).map(([s, Icon, label]) => (
                  <button
                    key={s}
                    onClick={() => chooseSource(s)}
                    aria-pressed={source === s}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                      source === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              {source === "fathers" ? (
                <WorkShelf shelf={shelf} loadError={loadError} selected={workSlug} onChoose={chooseWork} />
              ) : (<>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PRESET_ORDER.map(p => {
                  const Icon = PRESET_ICONS[p]
                  const selected = preset === p
                  return (
                    <button
                      key={p}
                      onClick={() => choosePreset(p)}
                      className={`group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        selected
                          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                        selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-white"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-900">{presetName(p)}</span>
                        <span className="mt-0.5 block text-sm text-slate-500">
                          {p === "custom"
                            ? tr("የሚፈልጉትን መጻሕፍት ብቻ", "Only the books you pick")
                            : am ? PRESETS[p].descAm : PRESETS[p].descEn}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {preset === "custom" && (
                <div className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-5">
                  {!structure && !loadError && (
                    <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> {tr("በመጫን ላይ…", "Loading…")}
                    </div>
                  )}
                  {structure && BIBLE_SECTIONS.map(section => {
                    const available = section.osis.filter(o => books.some(b => b.osis === o))
                    if (available.length === 0) return null
                    const allOn = available.every(o => custom.has(o))
                    return (
                      <div key={section.name} className="mb-5 last:mb-0">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {am ? section.nameAmharic : section.name}
                          </p>
                          <button
                            onClick={() => {
                              const next = new Set(custom)
                              available.forEach(o => (allOn ? next.delete(o) : next.add(o)))
                              setCustom(next)
                            }}
                            className="text-xs font-medium text-blue-600 hover:underline cursor-pointer"
                          >
                            {allOn ? tr("ሁሉንም አንሳ", "Clear") : tr("ሁሉንም ምረጥ", "Select all")}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {available.map(o => {
                            const b = books.find(x => x.osis === o)!
                            const on = custom.has(o)
                            return (
                              <button
                                key={o}
                                onClick={() => {
                                  const next = new Set(custom)
                                  if (on) next.delete(o)
                                  else next.add(o)
                                  setCustom(next)
                                }}
                                className={`rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                                  on
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                {am ? (b.amharicName ?? b.englishName) : b.englishName}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  <div className="mt-5 flex justify-end">
                    <button
                      disabled={custom.size === 0}
                      onClick={() => setStep(2)}
                      className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {tr(`ቀጥል · ${custom.size} መጻሕፍት`, `Continue · ${custom.size} ${custom.size === 1 ? "book" : "books"}`)}
                    </button>
                  </div>
                </div>
              )}
              </>)}
            </div>
          )}

          {/* ── Step 2: pace, with the plan previewed beside it ─────────── */}
          {step === 2 && (
            <div className="grid gap-0 lg:grid-cols-[1fr_1.05fr]">
              <div className="space-y-6 px-5 py-6 sm:px-7">
                {/* Pace mode */}
                <div>
                  <div className="inline-flex rounded-full bg-slate-100 p-1">
                    {([
                      ["date", CalendarDays, tr("በቀን ጨርስ", "Finish by a date")],
                      ["minutes", Clock, tr("በቀን ደቂቃ", "Minutes a day")],
                    ] as const).map(([mode, Icon, label]) => (
                      <button
                        key={mode}
                        onClick={() => setPaceMode(mode)}
                        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                          paceMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>

                  {paceMode === "date" ? (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {(source === "fathers" ? WORK_DURATIONS : DURATIONS).map(d => {
                          const end = addDays(startDate, d.days - 1)
                          const on = endDate === end
                          return (
                            <button
                              key={d.days}
                              onClick={() => setEndDate(end)}
                              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                                on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {am ? d.am : d.en}
                            </button>
                          )
                        })}
                      </div>
                      <label className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                        <span>{tr("ወይም እስከ", "or until")}</span>
                        <input
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={e => e.target.value && setEndDate(e.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {MINUTES.map(m => (
                        <button
                          key={m}
                          onClick={() => setMinutes(m)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                            minutes === m ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {tr(`${m} ደቂቃ`, `${m} min`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Start */}
                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="w-24 flex-shrink-0">{tr("መጀመሪያ ቀን", "Starts")}</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => {
                      if (!e.target.value) return
                      const shift = Math.round((new Date(e.target.value).getTime() - new Date(startDate).getTime()) / 86_400_000)
                      setStartDate(e.target.value)
                      setEndDate(addDays(endDate, shift))
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none"
                  />
                </label>

                {/* Rest days */}
                <div>
                  <p className="text-sm font-medium text-slate-800">{tr("የዕረፍት ቀናት", "Days off")}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tr("በእነዚህ ቀናት ንባብ አይመደብም።", "No reading is scheduled on these days.")}
                  </p>
                  <div className="mt-2.5 flex gap-1.5">
                    {(am ? WEEKDAY_SHORT_AM : WEEKDAY_SHORT_EN).map((label, i) => {
                      const on = rest.includes(i)
                      return (
                        <button
                          key={i}
                          onClick={() => setRest(on ? rest.filter(x => x !== i) : rest.length < 6 ? [...rest, i] : rest)}
                          aria-pressed={on}
                          className={`h-10 w-10 rounded-full text-xs font-semibold transition-colors cursor-pointer sm:h-11 sm:w-11 ${
                            on ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Options */}
                {source === "bible" && (showSideBySide || canAddPsalms) && (
                  <div className="space-y-2">
                    {showSideBySide && (
                      <Toggle
                        on={sideBySide}
                        onChange={setSideBySide}
                        title={tr("ብሉይና ሐዲስን ጎን ለጎን", "Old and New Testament side by side")}
                        hint={tr("በየቀኑ ከሁለቱም ኪዳናት ያንብቡ", "Read from both every day")}
                      />
                    )}
                    {canAddPsalms && (
                      <Toggle
                        on={withPsalms}
                        onChange={setWithPsalms}
                        title={tr("በየቀኑ አንድ መዝሙር", "A psalm every day")}
                        hint={tr("መዝሙረ ዳዊትን ደጋግመው ይጸልዩ", "Pray through the Psalter again and again")}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-6 sm:px-7 lg:border-l lg:border-t-0">
                {!result ? (
                  <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> {tr("በመጫን ላይ…", "Loading…")}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <Stat value={`~${result.summary.minutesPerDay}`} label={tr("ደቂቃ በቀን", "min a day")} />
                      <Stat value={`${result.summary.readingDays}`} label={tr("የንባብ ቀናት", "reading days")} />
                      <Stat value={`${result.summary.totalChapters}`} label={tr("ምዕራፎች", "chapters")} />
                    </div>
                    {result.days.length > 0 && (
                      <p className="mt-3 text-sm text-slate-600">
                        {tr("የሚጠናቀቅበት ቀን፦", "Finishes")}{" "}
                        <span className="font-semibold text-slate-900">{longDate(result.days[result.days.length - 1].date)}</span>
                      </p>
                    )}

                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {tr("የመጀመሪያዎቹ ቀናት", "The first days")}
                    </p>
                    <ol className="mt-2 divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {result.days.slice(0, 6).map(d => (
                        <li key={d.dayNumber} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5 w-12 flex-shrink-0 text-xs font-semibold text-slate-400">
                            {tr(`ቀን ${d.dayNumber}`, `Day ${d.dayNumber}`)}
                          </span>
                          <span className="min-w-0 flex-1 text-sm text-slate-800">
                            {d.readings.map(r => readingText(r, names, am)).join(" · ")}
                          </span>
                          <span className="flex-shrink-0 text-xs text-slate-400">{shortDate(d.date)}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-slate-500">
              {!signedIn
                ? tr("ሂደትዎን ለመቆጠብ ይግቡ — ያዘጋጁት ዕቅድ አይጠፋም።", "Sign in to save your progress — the plan you built is kept.")
                : adding
                  ? tr("ይህ ዕቅድ ከሌሎች ዕቅዶችዎ ጎን ይጨመራል።", "This plan is added alongside your other plans.")
                  : tr("ዕቅዱን በማንኛውም ጊዜ ማቆም ወይም መቀየር ይችላሉ።", "You can stop or change the plan any time.")}
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={start}
              disabled={saving || !result || result.days.length === 0}
              className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {signedIn ? tr("ዕቅዱን ይጀምሩ", "Start this plan") : tr("ለመጀመር ይግቡ", "Sign in to start")}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function Toggle({ on, onChange, title, hint }: { on: boolean; onChange: (v: boolean) => void; title: string; hint: string }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50 cursor-pointer"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${on ? "bg-blue-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}>
          {on && <Check className="m-auto mt-[3px] h-3.5 w-3.5 text-blue-600" />}
        </span>
      </span>
    </button>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center">
      <p className="text-xl font-semibold text-slate-900 tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

/** The Church Fathers works, in suggested order, with how long each takes. */
function WorkShelf({ shelf, loadError, selected, onChoose }: {
  shelf: WorkMeta[] | null
  loadError: boolean
  selected: string | null
  onChoose: (slug: string) => void
}) {
  const { am, tr } = useTr()
  if (!shelf) {
    return loadError ? null : (
      <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> {tr("በመጫን ላይ…", "Loading…")}
      </div>
    )
  }
  const length = (w: WorkMeta) => {
    const minutes = Math.max(5, Math.round(w.words / WORDS_PER_MINUTE / 5) * 5)
    if (minutes < 60) return tr(`በአጠቃላይ ~${minutes} ደቂቃ`, `about ${minutes} min in all`)
    const hours = Math.round((minutes / 60) * 2) / 2
    return tr(`በአጠቃላይ ~${hours} ሰዓት`, `about ${hours} ${hours === 1 ? "hour" : "hours"} in all`)
  }
  return (
    <div>
      <p className="mb-4 max-w-2xl text-sm text-slate-600">
        {tr(
          "ሐዋርያውያን አበው — ከሐዋርያት ቀጥሎ የነበሩት የመጀመሪያው ትውልድ መምህራን። አጫጭርና ለመጀመር ምቹ ናቸው፤ በተጠቆመው ቅደም ተከተል ተዘርዝረዋል።",
          "The Apostolic Fathers: the generation that followed the Apostles. Short and a good place to begin, listed in a suggested order.",
        )}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shelf.map((w, i) => {
          const on = selected === w.slug
          return (
            <button
              key={w.slug}
              onClick={() => onChoose(w.slug)}
              className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                on ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {am ? (w.authorAm ?? w.author) : w.author}
                </span>
                {i === 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {tr("ከዚህ ይጀምሩ", "Start here")}
                  </span>
                )}
              </span>
              <span className="mt-1 font-semibold text-slate-900">{am ? (w.titleAm ?? w.title) : w.title}</span>
              <span className="mt-1 text-sm leading-relaxed text-slate-600">{am ? (w.descriptionAm ?? w.description) : w.description}</span>
              <span className="mt-2 text-xs font-medium text-slate-400">
                {length(w)} · {tr(`${w.sections.length} ምዕራፎች`, `${w.sections.length} chapters`)}
              </span>
            </button>
          )
        })}
      </div>
      {am && <p className="mt-4 text-xs text-slate-400">መጻሕፍቱ በእንግሊዝኛ ትርጉም (1885) ይገኛሉ።</p>}
    </div>
  )
}
