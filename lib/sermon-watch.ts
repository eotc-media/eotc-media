import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"
import { GEMINI_MODEL } from "@/lib/gemini"
import { fetchRecentUploads, fetchVideoDetails, type YoutubeVideoDetails } from "@/lib/youtube"
import { getTopics, MAX_TOPICS, TOPIC_GROUPS, type Topic } from "@/lib/sermon-topics"

// The daily channel check. Once a day it looks at the newest uploads of every
// channel the site already has sermons from, asks Gemini which of the new
// videos are sermons (from title, description, channel and length), and adds
// those as *pending* sermons, with a suggested preacher, language and topics,
// for an admin to approve under New sermons. Nothing is published by itself.
//
// Every video it looks at is recorded (sm_channel_videos) with the verdict, so
// it is judged only once, and an admin can add one that was passed over.

/** Only videos this recent are considered, so a channel's back catalogue is
 *  never swept in; a few days' margin covers a day the check did not run. */
const WINDOW_DAYS = 4
const UPLOADS_PER_CHANNEL = 8
/** Shorter than this is a clip or announcement, not a sermon. */
const MIN_SECONDS = 8 * 60
const BATCH = 15

export interface WatchResult {
  channels: number
  newVideos: number
  sermons: number
  notSermons: number
  errors: string[]
}

export async function runChannelCheck(): Promise<WatchResult> {
  const result: WatchResult = { channels: 0, newVideos: 0, sermons: 0, notSermons: 0, errors: [] }
  if (!process.env.YOUTUBE_API_KEY) return { ...result, errors: ["YOUTUBE_API_KEY is not configured"] }
  if (!process.env.GEMINI_API_KEY) return { ...result, errors: ["GEMINI_API_KEY is not configured"] }

  const channels = await prisma.smChannel.findMany({
    where: { ytChannelId: { not: null }, sermons: { some: { approvalStatus: { name: "Accepted" } } } },
    select: { id: true, name: true, ytChannelId: true },
  })
  result.channels = channels.length

  // 1. Recent uploads of each channel (one cheap request each, a few at a time).
  const since = Date.now() - WINDOW_DAYS * 86_400_000
  const found: { videoId: string; channelId: number }[] = []
  for (let i = 0; i < channels.length; i += 8) {
    await Promise.all(channels.slice(i, i + 8).map(async c => {
      try {
        const uploads = await fetchRecentUploads(c.ytChannelId!, UPLOADS_PER_CHANNEL)
        uploads.filter(u => Date.parse(u.publishedAt) >= since).forEach(u => found.push({ videoId: u.videoId, channelId: c.id }))
      } catch (e) {
        result.errors.push(`${c.name}: ${e instanceof Error ? e.message : "uploads failed"}`)
      }
    }))
  }
  if (found.length === 0) return result

  // 2. Leave out what is already known: judged before, or already a sermon.
  const ids = found.map(f => f.videoId)
  const [seen, existing] = await Promise.all([
    prisma.smChannelVideo.findMany({ where: { videoId: { in: ids } }, select: { videoId: true } }),
    prisma.smSermon.findMany({ where: { videoId: { in: ids } }, select: { videoId: true } }),
  ])
  const known = new Set([...seen, ...existing].map(v => v.videoId))
  const fresh = found.filter(f => !known.has(f.videoId))
  if (fresh.length === 0) return result

  const details = await fetchVideoDetails(fresh.map(f => f.videoId))
  const channelOf = new Map(fresh.map(f => [f.videoId, f.channelId]))
  const nameOf = new Map(channels.map(c => [c.id, c.name]))

  // Live and upcoming broadcasts are looked at again once they have ended.
  const videos = [...details.values()].filter(v => channelOf.has(v.videoId) && v.liveBroadcastContent === "none")
  result.newVideos = videos.length

  // 3. Too short to be a sermon: no need to ask.
  const short = videos.filter(v => v.durationSeconds > 0 && v.durationSeconds < MIN_SECONDS)
  for (const v of short) {
    await record(v, channelOf.get(v.videoId)!, "not_sermon", `Only ${Math.round(v.durationSeconds / 60)} minutes long`)
    result.notSermons++
  }

  // 4. Ask Gemini about the rest, a batch at a time.
  const topics = await getTopics()
  const rest = videos.filter(v => !short.includes(v))
  for (let i = 0; i < rest.length; i += BATCH) {
    const batch = rest.slice(i, i + BATCH)
    const verdicts = await classify(batch.map(v => ({ video: v, channel: nameOf.get(channelOf.get(v.videoId)!) ?? "" })), topics)
    if ("error" in verdicts) { result.errors.push(`Gemini: ${verdicts.error}`); continue } // tried again tomorrow
    for (const v of batch) {
      const verdict = verdicts.map.get(v.videoId)
      if (!verdict) continue
      const channelId = channelOf.get(v.videoId)!
      try {
        if (verdict.isSermon) {
          await addPendingSermon(v, channelId, verdict, topics)
          result.sermons++
        } else {
          await record(v, channelId, "not_sermon", verdict.reason)
          result.notSermons++
        }
      } catch (e) {
        // Not recorded, so it is tried again tomorrow.
        result.errors.push(`${v.title}: ${e instanceof Error ? e.message : "could not be saved"}`)
      }
    }
  }
  return result
}

interface Verdict { isSermon: boolean; language: string; preacher: string | null; topics: string[]; reason: string }

async function classify(items: { video: YoutubeVideoDetails; channel: string }[], topics: Topic[]): Promise<{ map: Map<string, Verdict> } | { error: string }> {
  const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  })
  const list = TOPIC_GROUPS.map(g => `${g.en}: ` + topics.filter(t => t.groupKey === g.key).map(t => t.slug).join(", ")).join("\n")
  const videos = items.map(({ video: v, channel }) => ({
    id: v.videoId,
    title: v.title,
    description: v.description.replace(/\s+/g, " ").slice(0, 900),
    channel,
    minutes: Math.round(v.durationSeconds / 60),
  }))

  const prompt = `You help a website of the Ethiopian Orthodox Tewahedo Church collect sermons from YouTube channels.

For each video below, decide whether it is a sermon: one person teaching or preaching (a sermon, a homily, a Bible or doctrine lesson, a spiritual talk). These are NOT sermons: hymns or mezmur, a recorded liturgy or service, news, interviews or panel talks, film or drama, trailers, announcements, fundraising appeals, prayers alone, children's songs, or anything not Orthodox Tewahedo.

For a sermon, also give:
- language: "am" (Amharic), "en" (English) or "other"
- preacher: the preacher's name as written in the title or description (with title such as Abba, Memhir, Deacon), or null if not stated
- topics: 1 to ${MAX_TOPICS} topic slugs it is about, most important first, from this list only:
${list}

Give a short reason for every verdict. When unsure whether it is a sermon, say it is not.

Videos (JSON):
${JSON.stringify(videos)}

Answer with JSON only:
{"videos": [{"id": "<id>", "is_sermon": true | false, "language": "am" | "en" | "other", "preacher": "<name>" | null, "topics": ["<slug>"], "reason": "<one short sentence>"}]}`

  try {
    const res = await model.generateContent(prompt)
    const parsed = JSON.parse(res.response.text()) as { videos?: { id: string; is_sermon: boolean; language?: string; preacher?: string | null; topics?: string[]; reason?: string }[] }
    const slugs = new Set(topics.map(t => t.slug))
    return {
      map: new Map((parsed.videos ?? []).map(v => [String(v.id), {
        isSermon: v.is_sermon === true,
        language: v.language ?? "other",
        preacher: typeof v.preacher === "string" && v.preacher.trim() ? v.preacher.trim().slice(0, 120) : null,
        topics: (Array.isArray(v.topics) ? v.topics.map(String) : []).filter(s => slugs.has(s)).slice(0, MAX_TOPICS),
        reason: String(v.reason ?? "").slice(0, 300),
      }])),
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "request failed" }
  }
}

function record(v: YoutubeVideoDetails, channelId: number, verdict: "sermon" | "not_sermon", reason: string, sermonId?: number) {
  return prisma.smChannelVideo.upsert({
    where: { videoId: v.videoId },
    create: {
      channelId, videoId: v.videoId, title: v.title.slice(0, 500),
      publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
      durationSeconds: v.durationSeconds || null,
      verdict, reason, sermonId: sermonId ?? null,
    },
    update: { verdict, reason, sermonId: sermonId ?? null },
  })
}

/** Who a sermon found by the check is filed under: the site's first super admin. */
async function botUserId(): Promise<number | null> {
  const u = await prisma.user.findFirst({
    where: { roles: { some: { role: { code: "super_admin" } } } },
    orderBy: { id: "asc" },
    select: { id: true },
  })
  return u?.id ?? null
}

export function sermonSlug(title: string): string {
  return title.trim().replace(/\s+/g, "-").replace(/[^\wሀ-፿-]/g, "").slice(0, 120) + "-" + Date.now().toString(36)
}

/** Add a video as a pending sermon, with what Gemini suggested, and record it. */
export async function addPendingSermon(v: YoutubeVideoDetails, channelId: number, verdict: Pick<Verdict, "language" | "preacher" | "topics" | "reason">, topics?: Topic[]) {
  const [userId, submitted, languages, allTopics] = await Promise.all([
    botUserId(),
    prisma.smApprovalStatus.findFirst({ where: { name: "Submitted" }, select: { id: true } }),
    prisma.smLanguage.findMany({ select: { id: true, name: true } }),
    topics ? Promise.resolve(topics) : getTopics(),
  ])
  if (!userId || !submitted) throw new Error("No super admin or no Submitted status to file the sermon under")

  const languageId = languages.find(l => (verdict.language === "am" ? l.name === "አማርኛ" : verdict.language === "en" ? l.name === "English" : false))?.id
  const topicIds = verdict.topics.map(s => allTopics.find(t => t.slug === s)?.id).filter((x): x is number => !!x)

  const sermon = await prisma.$transaction(async tx => {
    const s = await tx.smSermon.create({
      data: {
        userId,
        approvalStatusId: submitted.id,
        channelId,
        slug: sermonSlug(v.title),
        videoId: v.videoId,
        title: v.title,
        publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
        preacher: verdict.preacher,
        thumbnailDefault: v.thumbnailDefault,
        thumbnailMedium: v.thumbnailMedium,
        thumbnailHigh: v.thumbnailHigh,
        thumbnailStandard: v.thumbnailStandard,
        thumbnailMaxres: v.thumbnailMaxres,
      },
    })
    if (languageId) await tx.smLanguageSermon.create({ data: { sermonId: s.id, languageId } })
    if (topicIds.length) await tx.smSermonTopic.createMany({ data: topicIds.map(topicId => ({ sermonId: s.id, topicId, source: "ai" })), skipDuplicates: true })
    return s
  })
  await record(v, channelId, "sermon", verdict.reason, sermon.id)
  return sermon
}
