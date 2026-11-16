import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { getSermon, getRelatedSermons } from "@/lib/api/sermons"
import { absoluteUrl, jsonLd } from "@/lib/seo"
import Navbar from "@/components/Navbar"
import SermonPlayer from "@/components/sermons/SermonPlayer"
import SermonAbout from "@/components/sermons/SermonAbout"
import { ArrowLeft } from "lucide-react"
import ShareButton from "@/components/ShareButton"
import { bestThumbCandidates } from "@/lib/thumbnails"
import SermonFavoriteButton from "@/components/sermons/SermonFavoriteButton"
import SermonCard from "@/components/sermons/SermonCard"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined
  const result = await getSermon(slug, userId)
  if (!result) return {}
  const { sermon } = result
  const preachers = sermon.preachers?.map(p => p.name).join(", ")
  const description =
    sermon.description ??
    `Watch the Ethiopian Orthodox Tewahedo sermon "${sermon.title}"${preachers ? ` by ${preachers}` : ""} on EOTC Media. ` +
    `"${sermon.title}" ስብከት ይመልከቱ።`
  const thumbnail = sermon.thumbnailMaxres || sermon.thumbnailStandard || sermon.thumbnailHigh
  return {
    title: `${sermon.title} — Sermon | ስብከት`,
    description,
    keywords: [
      sermon.title, "Ethiopian Orthodox sermon", "Amharic sermon", "EOTC teaching", "ስብከት", "መንፈሳዊ ትምህርት",
      ...(sermon.preachers?.map(p => p.name) ?? []),
    ],
    alternates: { canonical: `/sermons/${encodeURIComponent(sermon.slug)}` },
    openGraph: {
      title: `${sermon.title} — Sermon | ስብከት`,
      description,
      url: `/sermons/${encodeURIComponent(sermon.slug)}`,
      type: "video.other",
      images: thumbnail ? [{ url: thumbnail, alt: sermon.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${sermon.title} — Sermon`,
      description,
      images: thumbnail ? [thumbnail] : undefined,
    },
  }
}

export default async function SermonPage({ params }: PageProps) {
  const { slug } = await params

  const session = await auth()
  const userId = session?.user?.id ? parseInt(session.user.id) : undefined

  const result = await getSermon(slug, userId)
  if (!result) notFound()

  const { sermon, isFavorited } = result

  const categoryIds = sermon.categories?.map(c => c.id) ?? []
  const related = await getRelatedSermons(sermon.id, categoryIds, 12, sermon.topics?.map(t => t.id) ?? [])

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: sermon.title,
            description: sermon.description ?? `Ethiopian Orthodox Tewahedo sermon "${sermon.title}".`,
            thumbnailUrl: [sermon.thumbnailMaxres, sermon.thumbnailStandard, sermon.thumbnailHigh].filter(Boolean),
            uploadDate: (sermon.publishedAt ?? sermon.createdAt).toISOString(),
            embedUrl: `https://www.youtube.com/embed/${sermon.videoId}`,
            url: absoluteUrl(`/sermons/${encodeURIComponent(sermon.slug)}`),
            inLanguage: "am",
            genre: "Religious",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Sermons", item: absoluteUrl("/sermons") },
              { "@type": "ListItem", position: 3, name: sermon.title, item: absoluteUrl(`/sermons/${encodeURIComponent(sermon.slug)}`) },
            ],
          }),
        }}
      />
      <Navbar />
      <div className="pt-16">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-10">
          <Link href="/sermons" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Sermons
          </Link>

          <div className="mt-5 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="min-w-0">
              {/* Sticky player on phones */}
              <div className="sticky top-16 z-10 -mx-4 bg-slate-50 px-4 pb-2 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pb-0">
                <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
                  <SermonPlayer videoId={sermon.videoId} slug={sermon.slug} thumbnailCandidates={bestThumbCandidates(sermon)} title={sermon.title} />
                </div>
              </div>

              <div className="mt-5 flex items-start justify-between gap-4">
                <h1 className="text-lg font-semibold leading-snug tracking-tight text-slate-900 sm:text-xl">{sermon.title}</h1>
                <div className="mt-0.5 flex flex-shrink-0 items-center gap-3">
                  <ShareButton path={`/sermons/${sermon.slug}`} title={sermon.title} />
                  <SermonFavoriteButton sermonId={sermon.id} initialFavorited={isFavorited} userId={userId} />
                </div>
              </div>

              {sermon.channel?.name && (
                <Link href={`/sermons/channels/${sermon.channel.slug}`} className="mt-3 inline-flex items-center gap-2.5">
                  {sermon.channel.thumbnailHigh ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={sermon.channel.thumbnailHigh} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                      {sermon.channel.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-800 hover:text-blue-700">{sermon.channel.name}</span>
                </Link>
              )}

              {sermon.description && (
                <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{sermon.description}</p>
                </div>
              )}
            </div>

            <aside className="lg:sticky lg:top-20">
              <SermonAbout sermon={sermon} />
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-5 text-lg font-semibold tracking-tight text-slate-900">Related sermons</h2>
              <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                {related.map(s => <SermonCard key={s.id} sermon={s} userId={userId} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
