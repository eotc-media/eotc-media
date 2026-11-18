import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"
import { GEMINI_MODEL } from "@/lib/gemini"
import { fetchVideoDetails, type YoutubeVideoDetails } from "@/lib/youtube"
import { getTopics, MAX_TOPICS } from "@/lib/sermon-topics"

// Filling in the Submit forms from the video: once a link is pasted, the
// video's title, description and channel are read from YouTube and Gemini
// suggests the language, the preacher or singer, and the topics or
// categories. The member checks them before submitting; nothing is saved here.
// (YouTube does not give out other channels' captions, so the transcript is
// not used; the title usually names the preacher or singer.)

export interface VideoBasics { videoId: string; title: string; channel: string; thumbnail: string }

async function video(videoId: string): Promise<YoutubeVideoDetails | null> {
  return (await fetchVideoDetails([videoId])).get(videoId) ?? null
}

function ask<T>(prompt: string): Promise<T | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return Promise.resolve(null)
  const model = new GoogleGenerativeAI(key).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  })
  return model.generateContent(prompt).then(r => JSON.parse(r.response.text()) as T).catch(() => null)
}

const about = (v: YoutubeVideoDetails, channel: string) => JSON.stringify({
  title: v.title,
  description: v.description.replace(/\s+/g, " ").slice(0, 1200),
  channel,
  minutes: Math.round(v.durationSeconds / 60),
})

const basics = (v: YoutubeVideoDetails, channel: string): VideoBasics =>
  ({ videoId: v.videoId, title: v.title, channel, thumbnail: v.thumbnailMedium })

async function channelName(v: YoutubeVideoDetails, table: "sermon" | "hymn"): Promise<string> {
  if (table === "sermon") return (await prisma.smChannel.findUnique({ where: { ytChannelId: v.channelId }, select: { name: true } }))?.name ?? ""
  return (await prisma.hmChannel.findFirst({ where: { ytChannelId: v.channelId }, select: { title: true } }))?.title ?? ""
}

// ── Sermons ──────────────────────────────────────────────────────────────────

export interface SermonSuggestion {
  video: VideoBasics
  /** Already on the site under this slug. */
  existing: string | null
  languageId: number | null
  preacher: string | null
  topicIds: number[]
}

export async function suggestSermon(videoId: string): Promise<SermonSuggestion | null> {
  const v = await video(videoId)
  if (!v) return null
  const [channel, existing, languages, topics] = await Promise.all([
    channelName(v, "sermon"),
    prisma.smSermon.findFirst({ where: { videoId }, select: { slug: true } }),
    prisma.smLanguage.findMany({ select: { id: true, name: true } }),
    getTopics(),
  ])
  const answer = await ask<{ language?: number; preacher?: string | null; topics?: string[] }>(
`An Ethiopian Orthodox Tewahedo sermon video is being added to a website. From what YouTube says about it, suggest:
- language: the id of the language it is preached in, from ${JSON.stringify(languages)}
- preacher: the preacher's name as written in the title or description, with title (Abba, Memhir, Deacon, Kesis…), or null if not given
- topics: 1 to ${MAX_TOPICS} slugs of what it is about, most important first, from: ${topics.map(t => `${t.slug} (${t.nameEn})`).join(", ")}

Video: ${about(v, channel || "unknown")}

Answer with JSON only: {"language": <id>, "preacher": "<name>" | null, "topics": ["<slug>"]}`)
  const bySlug = new Map(topics.map(t => [t.slug, t.id]))
  return {
    video: basics(v, channel),
    existing: existing?.slug ?? null,
    languageId: languages.some(l => l.id === answer?.language) ? answer!.language! : null,
    preacher: typeof answer?.preacher === "string" && answer.preacher.trim() ? answer.preacher.trim().slice(0, 120) : null,
    topicIds: (answer?.topics ?? []).map(s => bySlug.get(String(s))).filter((x): x is number => !!x).slice(0, MAX_TOPICS),
  }
}

// ── Hymns ────────────────────────────────────────────────────────────────────

export interface HymnSuggestion {
  video: VideoBasics
  existing: string | null
  languageId: number | null
  singer: string | null
  /** At most one per category of the language. */
  subCategoryIds: number[]
}

export async function suggestHymn(videoId: string): Promise<HymnSuggestion | null> {
  const v = await video(videoId)
  if (!v) return null
  const [channel, existing, languages, categories] = await Promise.all([
    channelName(v, "hymn"),
    prisma.hmHymn.findFirst({ where: { videoId }, select: { slug: true } }),
    prisma.hmLanguage.findMany({ select: { id: true, name: true } }),
    prisma.hmCategory.findMany({
      select: { id: true, name: true, languageId: true, subCategories: { select: { id: true, name: true } } },
      orderBy: { id: "asc" },
    }),
  ])
  const answer = await ask<{ language?: number; singer?: string | null; subcategories?: number[] }>(
`An Ethiopian Orthodox Tewahedo hymn (mezmur) video is being added to a website. From what YouTube says about it, suggest:
- language: the id of the language it is sung in, from ${JSON.stringify(languages)}
- singer: the singer's or choir's name as written in the title or description, or null if not given
- subcategories: for that language's categories below, the one best-fitting subcategory id in each category you can tell from the information (skip a category if you cannot tell; "recording type" is audio only, audio and video, or in a church gathering)

Categories by language (language id → categories with their subcategories):
${JSON.stringify(categories.map(c => ({ language: c.languageId, category: c.name, subcategories: c.subCategories })))}

Video: ${about(v, channel || "unknown")}

Answer with JSON only: {"language": <id>, "singer": "<name>" | null, "subcategories": [<id>]}`)
  const languageId = languages.some(l => l.id === answer?.language) ? answer!.language! : null
  // Keep only subcategories of the chosen language, one per category.
  const ofLanguage = categories.filter(c => c.languageId === languageId)
  const picked: number[] = []
  for (const id of answer?.subcategories ?? []) {
    const cat = ofLanguage.find(c => c.subCategories.some(s => s.id === Number(id)))
    if (cat && !picked.some(p => cat.subCategories.some(s => s.id === p))) picked.push(Number(id))
  }
  return {
    video: basics(v, channel),
    existing: existing?.slug ?? null,
    languageId,
    singer: typeof answer?.singer === "string" && answer.singer.trim() ? answer.singer.trim().slice(0, 120) : null,
    subCategoryIds: picked,
  }
}
