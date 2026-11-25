import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"
import { GEMINI_MODEL } from "@/lib/gemini"
import { TOPIC_GROUPS } from "@/lib/sermon-topic-groups"

export { TOPIC_GROUPS }

// Sermon topics: one list, named in Amharic and English, in a few groups.
// A sermon has up to three. Gemini suggests them from what a sermon says about
// itself (title, description, preacher, channel); an admin approves them, and
// only approved topics show on the site.


export type TopicGroupKey = (typeof TOPIC_GROUPS)[number]["key"]

export interface Topic { id: number; slug: string; groupKey: string; nameAm: string; nameEn: string }

export const MAX_TOPICS = 3

/** Every topic, in group order and then their own order. */
export async function getTopics(): Promise<Topic[]> {
  const rows = await prisma.smTopic.findMany({ select: { id: true, slug: true, groupKey: true, nameAm: true, nameEn: true, position: true } })
  const g = (k: string) => TOPIC_GROUPS.findIndex(x => x.key === k)
  return rows
    .sort((a, b) => g(a.groupKey) - g(b.groupKey) || a.position - b.position || a.id - b.id)
    .map(({ id, slug, groupKey, nameAm, nameEn }) => ({ id, slug, groupKey, nameAm, nameEn }))
}

const BATCH = 20

/**
 * Suggest topics for the next sermons that have none, up to `limit` (in
 * batches Gemini answers at once). Returns how many were handled and how many
 * are still without topics.
 */
export async function suggestTopicsForNext(limit = BATCH): Promise<{ handled: number; remaining: number; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { handled: 0, remaining: await countWithoutTopics(), error: "GEMINI_API_KEY is not configured" }

  const sermons = await prisma.smSermon.findMany({
    where: { topics: { none: {} } },
    orderBy: { id: "asc" },
    take: Math.min(limit, BATCH),
    select: {
      id: true, title: true, description: true, preacher: true,
      channel: { select: { name: true } },
      preachers: { select: { preacher: { select: { name: true } } } },
      languages: { select: { language: { select: { name: true } } } },
      categories: { select: { category: { select: { name: true } } } },
      subCategories: { select: { subCategory: { select: { name: true } } } },
    },
  })
  if (sermons.length === 0) return { handled: 0, remaining: 0 }

  const topics = await getTopics()
  const suggestions = await askGemini(apiKey, topics, sermons.map(s => ({
    id: s.id,
    title: s.title,
    description: (s.description ?? "").replace(/\s+/g, " ").slice(0, 700),
    preacher: s.preachers.map(p => p.preacher.name).join(", ") || s.preacher || "",
    channel: s.channel.name,
    language: s.languages.map(l => l.language.name).join(", "),
    previous: [...s.categories.map(c => c.category.name), ...s.subCategories.map(c => c.subCategory.name)].join(" / "),
  })))
  if ("error" in suggestions) return { handled: 0, remaining: await countWithoutTopics(), error: suggestions.error }

  const bySlug = new Map(topics.map(t => [t.slug, t.id]))
  const rows = sermons.flatMap(s => {
    const slugs = [...new Set(suggestions.map.get(s.id) ?? [])].filter(x => bySlug.has(x)).slice(0, MAX_TOPICS)
    return slugs.map(slug => ({ sermonId: s.id, topicId: bySlug.get(slug)!, source: "ai" }))
  })
  if (rows.length) await prisma.smSermonTopic.createMany({ data: rows, skipDuplicates: true })
  return { handled: sermons.length, remaining: await countWithoutTopics() }
}

const countWithoutTopics = () => prisma.smSermon.count({ where: { topics: { none: {} } } })

interface SermonForTopics {
  id: number; title: string; description: string; preacher: string; channel: string; language: string; previous: string
}

async function askGemini(apiKey: string, topics: Topic[], sermons: SermonForTopics[]): Promise<{ map: Map<number, string[]> } | { error: string }> {
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  })
  const list = TOPIC_GROUPS.map(g =>
    `${g.en}:\n` + topics.filter(t => t.groupKey === g.key).map(t => `  ${t.slug} — ${t.nameEn} / ${t.nameAm}`).join("\n"),
  ).join("\n")

  const prompt = `You sort sermons of the Ethiopian Orthodox Tewahedo Church into topics, so people can find sermons on what they need.

Topics (slug — English / Amharic):
${list}

For each sermon below, choose the 1 to ${MAX_TOPICS} topics it is really about, most important first. Rules:
- Judge by the title first, then the description. Titles are often in Amharic; read them carefully.
- A feast or season topic only when the sermon is about that feast or season, not merely preached during it.
- Prefer one precise topic over several loose ones. Never choose a topic just because a word appears.
- "previous" is an older category someone chose; it can be wrong or too vague. Use it only as a hint.
- Use only the slugs listed above.

Sermons (JSON):
${JSON.stringify(sermons)}

Answer with JSON only:
{"sermons": [{"id": <id>, "topics": ["<slug>", ...]}]}`

  try {
    const res = await model.generateContent(prompt)
    const parsed = JSON.parse(res.response.text()) as { sermons?: { id: number; topics: string[] }[] }
    return { map: new Map((parsed.sermons ?? []).map(s => [Number(s.id), Array.isArray(s.topics) ? s.topics.map(String) : []])) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gemini request failed" }
  }
}

/** Set a sermon's topics, as chosen by an admin, and approve them. */
export async function setSermonTopics(sermonId: number, topicIds: number[]) {
  const ids = [...new Set(topicIds)].slice(0, MAX_TOPICS)
  const now = new Date()
  await prisma.$transaction([
    prisma.smSermonTopic.deleteMany({ where: { sermonId, topicId: { notIn: ids } } }),
    ...ids.map(topicId => prisma.smSermonTopic.upsert({
      where: { sermonId_topicId: { sermonId, topicId } },
      create: { sermonId, topicId, source: "admin", approvedAt: now },
      update: { approvedAt: now },
    })),
  ])
}

/** Approve the suggested topics of these sermons as they are. */
export async function approveSuggestions(sermonIds: number[]) {
  const r = await prisma.smSermonTopic.updateMany({
    where: { sermonId: { in: sermonIds }, approvedAt: null },
    data: { approvedAt: new Date() },
  })
  return r.count
}
