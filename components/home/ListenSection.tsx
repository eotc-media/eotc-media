"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import HymnCard from "@/components/hymns/HymnCard"
import SermonCard from "@/components/sermons/SermonCard"
import type { HmHymn } from "@/types/models/hymn"
import type { SmSermon } from "@/types/models/sermon"
import { useTr } from "./shared"

export default function ListenSection({
  hymns, sermons, userId,
}: {
  hymns: HmHymn[]
  sermons: SmSermon[]
  userId?: number
}) {
  const { tr } = useTr()
  if (hymns.length === 0 && sermons.length === 0) return null
  return (
    <section className="space-y-10">
      {hymns.length > 0 && (
        <Row title={tr("መዝሙራት", "Mezmur")} eyebrow={tr("ያዳምጡ", "Listen")} href="/hymns" seeAll={tr("ሁሉንም ይመልከቱ", "See all")}>
          {hymns.map(h => <HymnCard key={h.id} hymn={h} userId={userId} />)}
        </Row>
      )}
      {sermons.length > 0 && (
        <Row title={tr("ስብከቶች", "Sermons")} eyebrow={tr("ይማሩ", "Learn")} href="/sermons" seeAll={tr("ሁሉንም ይመልከቱ", "See all")}>
          {sermons.map(s => <SermonCard key={s.id} sermon={s} userId={userId} />)}
        </Row>
      )}
    </section>
  )
}

function Row({ title, eyebrow, href, seeAll, children }: {
  title: string; eyebrow: string; href: string; seeAll: string; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        </div>
        <Link href={href} className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
          {seeAll} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {/* On a phone the row scrolls sideways, so four cards cost one card's
          height rather than four. From sm up it is an ordinary grid. */}
      <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&>*]:w-[78%] [&>*]:flex-shrink-0 [&>*]:snap-start sm:[&>*]:w-auto">
        {children}
      </div>
    </div>
  )
}
