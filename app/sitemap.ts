import type { MetadataRoute } from "next"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { SITE_URL } from "@/lib/seo"

// Never prerendered at build (the DB isn't reachable then). The entry list is
// cached for a day via unstable_cache, so repeat crawler hits don't re-query.
export const dynamic = "force-dynamic"

const getSitemapEntries = unstable_cache(
  async () =>
    Promise.all([
      prisma.hmHymn.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { clicksCount: "desc" },
        take: 20000,
      }),
      prisma.smSermon.findMany({
        where: { approvalStatus: { name: "Accepted" } },
        select: { slug: true, updatedAt: true },
        orderBy: { clicksCount: "desc" },
        take: 20000,
      }),
      prisma.cbBook.findMany({
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.hmChannel.findMany({ select: { id: true, updatedAt: true } }),
      prisma.smChannel.findMany({ select: { id: true, updatedAt: true } }),
      prisma.hmSinger.findMany({ select: { id: true, updatedAt: true } }),
      prisma.blVerse.findMany({
        select: { bookId: true, chapter: true },
        distinct: ["bookId", "chapter"],
        orderBy: [{ bookId: "asc" }, { chapter: "asc" }],
      }),
    ]),
  ["sitemap-entries"],
  { revalidate: 86400 }
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/bible/amharic/1954/1/1`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/hymns`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/sermons`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/books`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/quiz`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/quiz/practice`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/liturgy`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/hymns/channels`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/sermons/channels`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ]

  // If the DB is unreachable, let this throw: a 5xx tells crawlers "retry later"
  // and they keep the previous sitemap. Returning 200 with only the static
  // routes would instead announce that the other ~40k URLs no longer exist.
  const [hymns, sermons, books, hymnChannels, sermonChannels, singers, bibleChapters] =
    await getSitemapEntries()

  const hymnRoutes: MetadataRoute.Sitemap = hymns.map(h => ({
    url: `${SITE_URL}/hymns/${encodeURIComponent(h.slug)}`,
    lastModified: h.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const sermonRoutes: MetadataRoute.Sitemap = sermons.map(s => ({
    url: `${SITE_URL}/sermons/${encodeURIComponent(s.slug)}`,
    lastModified: s.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const bookRoutes: MetadataRoute.Sitemap = books.map(b => ({
    url: `${SITE_URL}/books/${encodeURIComponent(b.slug)}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const hymnChannelRoutes: MetadataRoute.Sitemap = hymnChannels.map(c => ({
    url: `${SITE_URL}/hymns/channels/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  const sermonChannelRoutes: MetadataRoute.Sitemap = sermonChannels.map(c => ({
    url: `${SITE_URL}/sermons/channels/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  const singerRoutes: MetadataRoute.Sitemap = singers.map(s => ({
    url: `${SITE_URL}/hymns/singer/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  // Bible chapters for the default Amharic 1954 version — the canonical reading URLs
  const bibleRoutes: MetadataRoute.Sitemap = bibleChapters.map(v => ({
    url: `${SITE_URL}/bible/amharic/1954/${v.bookId}/${v.chapter}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.6,
  }))

  return [
    ...staticRoutes,
    ...hymnRoutes,
    ...sermonRoutes,
    ...bookRoutes,
    ...hymnChannelRoutes,
    ...sermonChannelRoutes,
    ...singerRoutes,
    ...bibleRoutes,
  ]
}
