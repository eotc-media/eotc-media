"use client"

import Link from "next/link"
import { useTr } from "./shared"

export default function ContributeSection({ signedIn }: { signedIn: boolean }) {
  const { tr } = useTr()
  return (
    <section className="bg-neutral-900 py-14">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {tr("ማኅበረሰባችንን ይቀላቀሉ", "Join our community")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-400 sm:text-base">
          {tr(
            "መንፈሳዊ ሥራዎችዎን ለሌሎች ያጋሩ፤ ለኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ማኅበረሰብ አስተዋጽኦ ያድርጉ።",
            "Share your spiritual resources with others and contribute to the Ethiopian Orthodox Tewahedo Church community.",
          )}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {!signedIn && (
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              {tr("አካውንት ይክፈቱ", "Create account")}
            </Link>
          )}
          <Link
            href="/?feedback=1"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 px-7 py-2.5 text-sm font-semibold text-neutral-200 transition-colors hover:bg-neutral-700"
          >
            {tr("ያግኙን", "Contact us")}
          </Link>
          <a
            href="https://github.com/eotc-media/eotc-media"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-700 px-7 py-2.5 text-sm font-semibold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200"
          >
            {tr("በ GitHub ያበርክቱ", "Contribute on GitHub")}
          </a>
        </div>
      </div>
    </section>
  )
}
