"use client"

import Link from "next/link"
import type { SmSermon } from "@/types/models/sermon"
import { useTr } from "@/components/home/shared"

/** Beside the player: what the sermon is about, who preached it, and where it is from. */
export default function SermonAbout({ sermon }: { sermon: SmSermon }) {
  const { am, tr } = useTr()
  const topics = sermon.topics ?? []
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-4 py-3 text-sm">
      <dt className="w-24 flex-shrink-0 text-slate-400">{label}</dt>
      <dd className="min-w-0 text-slate-700">{value}</dd>
    </div>
  )
  const date = sermon.publishedAt ? new Date(sermon.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      {topics.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-slate-900">{tr("ርዕሶች", "Topics")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map(t => (
              <Link key={t.id} href={`/sermons?topic=${t.slug}`} className="rounded-full bg-blue-50 px-3 py-1 text-[13px] font-medium text-blue-700 hover:bg-blue-100">
                {am ? t.nameAm : t.nameEn}
              </Link>
            ))}
          </div>
        </>
      )}
      <dl className={`divide-y divide-slate-100 ${topics.length ? "mt-4 border-t border-slate-100" : ""}`}>
        {sermon.preachers && sermon.preachers.length > 0 && row(tr("ሰባኪ", "Preacher"), (
          <span className="flex flex-wrap gap-x-2">
            {sermon.preachers.map(p => <Link key={p.id} href={`/sermons/preacher/${p.slug}`} className="font-medium text-blue-700 hover:underline">{p.name}</Link>)}
          </span>
        ))}
        {sermon.channel?.name && row(tr("ቻናል", "Channel"), (
          <Link href={`/sermons/channels/${sermon.channel.slug}`} className="font-medium text-blue-700 hover:underline">{sermon.channel.name}</Link>
        ))}
        {sermon.languages && sermon.languages.length > 0 && row(tr("ቋንቋ", "Language"), sermon.languages.map(l => l.name).join(", "))}
        {date && row(tr("ቀን", "Published"), date)}
        {sermon.clicksCount > 0 && row(tr("ታይቷል", "Clicks"), sermon.clicksCount.toLocaleString())}
      </dl>
    </div>
  )
}
