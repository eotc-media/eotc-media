"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight, BookOpen, Check, CheckCircle2, Cross, Flame, Loader2, Music2, BookHeart,
  RotateCcw, Sparkles, CalendarRange, Coffee, PartyPopper, ListChecks, Library, Plus, ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react"
import { PRESETS, minutesFor, planTitle, type AnyPlanConfig, type PresetKey } from "@/lib/reading-plan"
import type { ActivePlanView, StoppedPlanView } from "@/lib/reading-plan-server"
import PlanBuilder, { DRAFT_KEY, type PlanSource } from "./PlanBuilder"
import MiniCalendar, { type DayMark } from "./MiniCalendar"
import ReminderToggle from "./ReminderToggle"
import {
  useTr, readingText, shortDate, useLocalNow, useSelectedPlanId, selectPlan, planDayHref, planScheduleHref,
} from "./shared"

export default function ReadingPlanSection({
  plans, stopped, signedIn, today: serverToday, resume,
}: {
  plans: ActivePlanView[]
  stopped: StoppedPlanView[]
  signedIn: boolean
  today: string
  resume: boolean
}) {
  const { today } = useLocalNow({ today: serverToday, hour: 0 })
  const [builder, setBuilder] = useState<{ preset?: PresetKey; source?: PlanSource; draft?: AnyPlanConfig | null } | null>(null)
  const [draftDismissed, setDraftDismissed] = useState(false)

  // Back from signing in with a plan built beforehand: pick up exactly there.
  // The draft lives in localStorage, which the server cannot see — read it as
  // an external store so the server renders without it and the browser adds
  // it, rather than mismatching during hydration.
  const draftRaw = useSyncExternalStore(noSubscribe, readDraft, () => null)
  const draft = useMemo(() => {
    if (!resume || !signedIn || draftDismissed || !draftRaw) return null
    try { return JSON.parse(draftRaw) as AnyPlanConfig } catch { return null }
  }, [resume, signedIn, draftDismissed, draftRaw])
  const open = builder ?? (draft ? { draft } : null)

  // Several plans run side by side; the card shows one at a time.
  const selectedId = useSelectedPlanId()
  const index = Math.max(0, plans.findIndex(p => p.id === selectedId))
  const plan = plans[index] ?? null
  const go = (step: number) => selectPlan(plans[(index + step + plans.length) % plans.length].id)

  const marks = useMemo(() => {
    if (!plan) return undefined
    const m: Record<string, DayMark> = {}
    for (const d of plan.window) m[d.date] = d.completed ? "done" : d.date < today ? "missed" : "todo"
    return m
  }, [plan, today])

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {plan ? (
            <ActivePlan
              plan={plan}
              today={today}
              position={{ index, count: plans.length, prev: () => go(-1), next: () => go(1) }}
              onAddPlan={plans.length < MAX_PLANS ? () => setBuilder({}) : undefined}
            />
          ) : (
            <Picker onPick={preset => setBuilder({ preset })} onFathers={() => setBuilder({ source: "fathers" })} />
          )}
          {signedIn && stopped.length > 0 && <StoppedPlans stopped={stopped} canResume={plans.length < MAX_PLANS} />}
        </div>
        <div className="space-y-6">
          <MiniCalendar today={today} marks={marks} />
        </div>
      </div>

      {open && (
        <PlanBuilder
          open
          onClose={() => { setBuilder(null); setDraftDismissed(true) }}
          today={today}
          signedIn={signedIn}
          initialPreset={open.preset}
          initialConfig={open.draft}
          initialSource={"source" in open ? open.source : undefined}
          adding={plans.length > 0}
        />
      )}
    </>
  )
}

/** Matches MAX_ACTIVE_PLANS on the server. */
const MAX_PLANS = 5

const noSubscribe = () => () => {}
function readDraft(): string | null {
  try { return localStorage.getItem(DRAFT_KEY) } catch { return null }
}

// ── No plan yet ───────────────────────────────────────────────────────────────

const QUICK: { key: Exclude<PresetKey, "custom">; Icon: typeof BookOpen }[] = [
  { key: "whole-bible", Icon: BookOpen },
  { key: "new-testament", Icon: Cross },
  { key: "gospels", Icon: BookHeart },
  { key: "psalms-proverbs", Icon: Music2 },
]

function Picker({ onPick, onFathers }: { onPick: (p: PresetKey) => void; onFathers: () => void }) {
  const { am, tr } = useTr()
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/[0.04]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{tr("የንባብ ዕቅድ", "Reading plan")}</p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            {tr("መጽሐፍ ቅዱስን በየዕለቱ ያንብቡ", "Read the Bible, a day at a time")}
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
            {tr(
              "የሚያነቡትን ክፍልና የሚፈጀውን ጊዜ ይምረጡ። የዕለት ንባብዎን እናሰናዳለን፣ የደረሱበትን እንመዘግባለን፤ ሳያነቡ ያለፉት ቀናት ቢኖሩም ካቆሙበት እንዲቀጥሉ እናግዝዎታለን።",
              "Choose what to read and how long to take. We lay it out day by day, keep your place, and help you pick up again if you fall behind.",
            )}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {QUICK.map(({ key, Icon }) => (
              <button
                key={key}
                onClick={() => onPick(key)}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md cursor-pointer"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-snug text-slate-900">{am ? PRESETS[key].am : PRESETS[key].en}</span>
                  <span className="block text-xs text-slate-500">
                    {tr(`${PRESETS[key].days} ቀናት`, `${PRESETS[key].days} days`)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <button
              onClick={() => onPick("custom")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <ListChecks className="h-4 w-4" /> {tr("የራስዎን ዕቅድ ያውጡ", "Build your own")} <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onFathers}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Library className="h-4 w-4" /> {tr("የቤተ ክርስቲያን አበውን ያንብቡ", "Read the Church Fathers")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* An example day, so the idea is visible before anything is chosen. */}
        <div className="relative hidden self-center pb-5 md:block" aria-hidden="true">
          <div className="relative">
          <div className="absolute inset-x-6 -bottom-5 top-5 rounded-2xl border border-slate-200 bg-slate-50" />
          <div className="absolute inset-x-3 -bottom-2.5 top-2.5 rounded-2xl border border-slate-200 bg-white" />
          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{tr("ቀን 1", "Day 1")}</p>
              <p className="text-xs text-slate-400">{tr("~10 ደቂቃ", "~10 min")}</p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {[
                [tr("ዘፍጥረት 1–2", "Genesis 1–2"), "bg-amber-400"],
                [tr("የማቴዎስ ወንጌል 1", "Matthew 1"), "bg-blue-500"],
                [tr("መዝሙረ ዳዊት 1", "Psalm 1"), "bg-emerald-500"],
              ].map(([text, dot]) => (
                <li key={text} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  <span className="text-sm font-medium text-slate-800">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white">
              <Check className="h-4 w-4" /> {tr("እንደተነበበ ይመዝግቡ", "Mark as read")}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── A plan in progress ────────────────────────────────────────────────────────

const TRACK_DOTS = ["bg-amber-400", "bg-blue-500", "bg-emerald-500", "bg-violet-500"]

interface PlanPosition { index: number; count: number; prev: () => void; next: () => void }

function ActivePlan({ plan, today, position, onAddPlan }: {
  plan: ActivePlanView
  today: string
  position: PlanPosition
  /** Absent when the reader already follows as many plans as allowed. */
  onAddPlan?: () => void
}) {
  const { am, tr } = useTr()
  const router = useRouter()
  const [pending, setPending] = useState<number | null>(null)
  const [catching, setCatching] = useState(false)
  // Optimistic: the tick shows at once, and the server's refresh confirms it.
  const [local, setLocal] = useState<Record<number, boolean>>({})

  const todayDay = plan.window.find(d => d.date === today) ?? null
  const upcoming = plan.window.filter(d => d.date > today).slice(0, 4)
  const nextDay = upcoming[0] ?? null
  const isDone = (dayNumber: number, completed: boolean) => local[dayNumber] ?? completed

  const finished = plan.completedDays >= plan.totalDays
  const exact = (plan.completedDays / plan.totalDays) * 100
  // One day into a year is 0.3%, which rounds to a discouraging 0%.
  const pct = Math.round(exact)
  const pctLabel = plan.completedDays > 0 && pct === 0 ? "<1%" : `${pct}%`
  const currentNumber = todayDay?.dayNumber ?? nextDay?.dayNumber ?? plan.totalDays
  const title = planTitle(plan.config, plan.totalDays, am ? "am" : "en")

  async function toggle(dayNumber: number, done: boolean) {
    setPending(dayNumber)
    setLocal(l => ({ ...l, [dayNumber]: done }))
    try {
      const res = await fetch(`/api/reading-plans/${plan.id}/days/${dayNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done }),
      })
      if (!res.ok) setLocal(l => ({ ...l, [dayNumber]: !done }))
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  // A finished plan leaves the card; it stays among the reader's stopped plans.
  const [puttingAway, setPuttingAway] = useState(false)
  async function putAway() {
    setPuttingAway(true)
    await fetch(`/api/reading-plans/${plan.id}`, { method: "DELETE" }).catch(() => null)
    router.refresh()
  }

  async function catchUp() {
    setCatching(true)
    try {
      await fetch(`/api/reading-plans/${plan.id}/catch-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ today }),
      })
      router.refresh()
    } finally {
      setCatching(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/[0.04]">
      {/* Plan header */}
      <div className="border-b border-slate-100 px-6 pb-5 pt-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">{tr("የንባብ ዕቅድ", "Reading plan")}</p>
              {position.count > 1 && <PlanNavigator position={position} />}
            </div>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 tabular-nums">
            {tr(`ቀን ${currentNumber} ከ ${plan.totalDays}`, `Day ${currentNumber} of ${plan.totalDays}`)}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-500" style={{ width: `${plan.completedDays > 0 ? Math.max(exact, 1.5) : 0}%` }} />
          </div>
          <span className="w-10 text-right text-xs font-semibold text-slate-500 tabular-nums">{pctLabel}</span>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        {/* Behind */}
        {plan.behind > 0 && !finished && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-rose-900">
              {tr(`${plan.behind} ቀን ወደ ኋላ ቀርተዋል።`, `You're ${plan.behind} ${plan.behind === 1 ? "day" : "days"} behind.`)}{" "}
              <span className="text-rose-700/80">{tr("ከዛሬ ጀምሮ ይቀጥሉ — ምንም አይጠፋም።", "Pick up from today — nothing is skipped.")}</span>
            </p>
            <button
              onClick={catchUp}
              disabled={catching}
              className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
            >
              {catching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {tr("ከዛሬ ይቀጥሉ", "Pick up today")}
            </button>
          </div>
        )}

        {finished ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <PartyPopper className="h-7 w-7" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-900">{tr("ዕቅዱን ጨርሰዋል!", "You finished the plan!")}</p>
            <p className="mt-1 text-sm text-slate-500">{tr(`${plan.totalDays} ቀናት፣ ሁሉም ተነቧል።`, `${plan.totalDays} days, every one read.`)}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {onAddPlan && (
                <button onClick={onAddPlan} className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
                  <Sparkles className="h-4 w-4" /> {tr("ሌላ ዕቅድ ያክሉ", "Add a plan")}
                </button>
              )}
              <button
                onClick={putAway}
                disabled={puttingAway}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                {tr("ከዝርዝሩ ያንሱ", "Put away")}
              </button>
            </div>
          </div>
        ) : todayDay ? (
          <TodayReading
            day={todayDay}
            done={isDone(todayDay.dayNumber, todayDay.completed)}
            pending={pending === todayDay.dayNumber}
            onToggle={done => toggle(todayDay.dayNumber, done)}
            plan={plan}
          />
        ) : (
          <div className="flex items-start gap-4 rounded-2xl bg-slate-50 px-5 py-5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
              <Coffee className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{tr("ዛሬ የዕረፍት ቀን ነው", "Today is a day off")}</p>
              {nextDay && (
                <p className="mt-1 text-sm text-slate-600">
                  {tr("ቀጣዩ ንባብ", "Next reading")} · {shortDate(nextDay.date)} ·{" "}
                  <span className="font-medium text-slate-800">{nextDay.readings.map(r => readingText(r, plan.bookNames, am)).join(" · ")}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {!finished && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat
              icon={<Flame className={`h-4 w-4 ${plan.streak > 0 ? "text-orange-500" : "text-slate-300"}`} />}
              value={plan.streak}
              label={tr("ተከታታይ ቀናት", "day streak")}
            />
            <Stat icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} value={plan.completedDays} label={tr("የተነበቡ ቀናት", "days read")} />
            <Stat icon={<CalendarRange className="h-4 w-4 text-blue-500" />} value={plan.totalDays - plan.completedDays} label={tr("የቀሩ ቀናት", "days left")} />
          </div>
        )}

        {/* Coming up */}
        {!finished && upcoming.length > 0 && (
          <div className="mt-7">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{tr("ቀጣይ ንባቦች", "Coming up")}</p>
            <ul className="mt-2 divide-y divide-slate-100">
              {upcoming.map(d => (
                <li key={d.dayNumber}>
                  <Link href={planDayHref(plan.id, d.dayNumber)} className="flex items-center gap-4 py-2.5 hover:text-blue-700">
                    <span className="w-20 flex-shrink-0 text-xs font-medium text-slate-400">{shortDate(d.date)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {d.readings.map(r => readingText(r, plan.bookNames, am)).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!finished && <ReminderToggle />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 sm:px-8">
        <Link href={planScheduleHref(plan.id)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
          {tr("ሙሉ መርሐ ግብር", "Full schedule")} <ArrowRight className="h-4 w-4" />
        </Link>
        {onAddPlan && (
          <button onClick={onAddPlan} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">
            <Plus className="h-4 w-4" /> {tr("ሌላ ዕቅድ ያክሉ", "Add a plan")}
          </button>
        )}
      </div>
    </section>
  )
}

function TodayReading({
  day, done, pending, onToggle, plan,
}: {
  day: ActivePlanView["window"][number]
  done: boolean
  pending: boolean
  onToggle: (done: boolean) => void
  plan: ActivePlanView
}) {
  const { am, tr } = useTr()
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{tr("የዛሬው ንባብ", "Today's reading")}</p>
        <p className="text-xs text-slate-500">{tr(`~${minutesFor(day.readings)} ደቂቃ`, `~${minutesFor(day.readings)} min`)}</p>
      </div>

      <ul className="mt-3 space-y-2">
        {day.readings.map((r, i) => (
          <li key={i}>
            <Link
              href={planDayHref(plan.id, day.dayNumber, i)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-3.5 transition-all hover:border-blue-300 hover:bg-blue-50/40"
            >
              <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${TRACK_DOTS[i % TRACK_DOTS.length]}`} />
              <span className={`min-w-0 flex-1 text-base font-semibold sm:text-lg ${done ? "text-slate-400 line-through decoration-slate-300" : "text-slate-900"}`}>
                {readingText(r, plan.bookNames, am)}
              </span>
              <span className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-blue-600 opacity-80 group-hover:opacity-100">
                {tr("ያንብቡ", "Read")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onToggle(!done)}
        disabled={pending}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all cursor-pointer disabled:opacity-70 ${
          done
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
            : "bg-blue-600 text-white shadow-sm shadow-blue-600/25 hover:bg-blue-700"
        }`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        {done ? tr("ተነቧል — ለመቀልበስ ይጫኑ", "Read — tap to undo") : tr("እንደተነበበ ይመዝግቡ", "Mark as read")}
      </button>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-lg font-semibold text-slate-900 tabular-nums">{value}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

function PlanNavigator({ position }: { position: PlanPosition }) {
  const { tr } = useTr()
  const btn = "flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
  return (
    <div className="flex items-center gap-0.5" aria-label={tr("ዕቅዶች", "Plans")}>
      <button onClick={position.prev} className={btn} aria-label={tr("ቀዳሚ ዕቅድ", "Previous plan")}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[2.75rem] text-center text-xs font-semibold text-slate-500 tabular-nums">
        {tr(`${position.index + 1} ከ ${position.count}`, `${position.index + 1} of ${position.count}`)}
      </span>
      <button onClick={position.next} className={btn} aria-label={tr("ቀጣይ ዕቅድ", "Next plan")}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Stopped plans ─────────────────────────────────────────────────────────────

/** Plans the reader stopped, with a way back into each. Folded away by default. */
function StoppedPlans({ stopped, canResume }: { stopped: StoppedPlanView[]; canResume: boolean }) {
  const { am, tr } = useTr()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState("")

  async function resume(id: number) {
    setBusy(id)
    setError("")
    const res = await fetch(`/api/reading-plans/${id}/resume`, { method: "POST" }).catch(() => null)
    if (res?.ok) {
      selectPlan(id)
      router.refresh()
    } else {
      setError((await res?.json().catch(() => null))?.error ?? tr("መቀጠል አልተቻለም።", "Could not resume the plan."))
    }
    setBusy(null)
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <span>{tr(`የቆሙ ዕቅዶች (${stopped.length})`, `Stopped plans (${stopped.length})`)}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {stopped.map(p => {
            const finished = p.completedDays >= p.totalDays
            return (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{planTitle(p.config, p.totalDays, am ? "am" : "en")}</p>
                  <p className="text-xs text-slate-400">
                    {tr(`${p.completedDays} ከ ${p.totalDays} ቀናት ተነበዋል`, `${p.completedDays} of ${p.totalDays} days read`)}
                  </p>
                </div>
                {finished ? (
                  <span className="text-xs font-medium text-emerald-600">{tr("ተጠናቋል", "Finished")}</span>
                ) : (
                  <button
                    onClick={() => resume(p.id)}
                    disabled={!canResume || busy !== null}
                    title={canResume ? undefined : tr("ቢበዛ 5 ዕቅዶች በአንድ ጊዜ", "At most 5 plans at a time")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {busy === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    {tr("ቀጥል", "Resume")}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {error && <p className="px-5 pb-3 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
