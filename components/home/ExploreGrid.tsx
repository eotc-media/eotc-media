"use client"

import Link from "next/link"
import { ArrowUpRight, BookOpen, BookMarked, HelpCircle, MessageSquare, Mic, Music } from "lucide-react"
import { useTr } from "./shared"

const MODULES = [
  {
    href: "/bible/amharic/1954/1/1", Icon: BookOpen, tint: "from-blue-500 to-indigo-600",
    am: "መጽሐፍ ቅዱስ", en: "Bible",
    dAm: "በአማርኛ፣ በእንግሊዝኛ፣ በኦሮምኛ እና በሌሎችም ቋንቋዎች", dEn: "In Amharic, English, Afaan Oromo and more",
  },
  {
    href: "/liturgy", Icon: Mic, tint: "from-amber-500 to-orange-600",
    am: "ቅዳሴ", en: "Liturgy",
    dAm: "ሥርዓተ ቅዳሴ በካህን፣ በዲያቆንና በሕዝብ", dEn: "The Divine Liturgy, by priest, deacon and people",
  },
  {
    href: "/hymns", Icon: Music, tint: "from-rose-500 to-pink-600",
    am: "መዝሙራት", en: "Hymns",
    dAm: "የኦርቶዶክስ ተዋሕዶ መዝሙራት", dEn: "Orthodox Tewahedo mezmur",
  },
  {
    href: "/sermons", Icon: MessageSquare, tint: "from-emerald-500 to-teal-600",
    am: "ስብከቶች", en: "Sermons",
    dAm: "ስብከቶችና ትምህርተ ወንጌል", dEn: "Sermons and gospel teaching",
  },
  {
    href: "/books", Icon: BookMarked, tint: "from-violet-500 to-purple-600",
    am: "መጻሕፍት", en: "Books",
    dAm: "የአበውና የዘመናችን መምህራን መጻሕፍት", dEn: "From the fathers and today's teachers",
  },
  {
    href: "/quiz", Icon: HelpCircle, tint: "from-sky-500 to-cyan-600",
    am: "ጥያቄዎች", en: "Quiz",
    dAm: "እውቀትዎን ይፈትኑ፣ ከሌሎች ጋር ይወዳደሩ", dEn: "Test yourself, or play with others",
  },
]

export default function ExploreGrid() {
  const { am, tr } = useTr()
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{tr("ያስሱ", "Explore")}</p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{tr("ሁሉም በአንድ ቦታ", "Everything in one place")}</h2>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {MODULES.map(m => (
          <Link
            key={m.href}
            href={m.href}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 sm:p-5"
          >
            <div className="flex items-start justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${m.tint} text-white shadow-sm`}>
                <m.Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </div>
            <p className="mt-4 font-semibold text-slate-900 sm:text-lg">{am ? m.am : m.en}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-sm">{am ? m.dAm : m.dEn}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
