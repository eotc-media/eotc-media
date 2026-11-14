import { revalidateTag, unstable_cache } from "next/cache"
import { getObject, putObject } from "@/lib/storage"

// The text of the Church Fathers library lives in R2, one folder per work:
//
//   library/<slug>/en.json   the English text: { sections: [{ position, paragraphs }] }
//   library/<slug>/am.json   its Amharic translation, chapter by chapter, each
//                            with whether an admin has approved it
//
// The database keeps only the index (cf_works, cf_sections: titles, lengths,
// positions), plus readers' notes and progress. Files are read through Next's
// data cache and written only by admin actions, which clear that cache.

export interface WorkText { sections: { position: number; paragraphs: string[] }[] }
export interface AmharicChapter { position: number; title: string | null; paragraphs: string[]; approved: boolean }
export interface WorkAmharic { sections: AmharicChapter[] }

const key = (slug: string, lang: "en" | "am") => `library/${slug}/${lang}.json`
const tag = (slug: string) => `library:${slug}`
const DAY = 60 * 60 * 24

async function readJson<T>(path: string): Promise<T | null> {
  const obj = await getObject(path)
  return obj ? (JSON.parse(new TextDecoder().decode(obj.body)) as T) : null
}

async function writeJson(path: string, data: unknown, slug: string) {
  await putObject(path, Buffer.from(JSON.stringify(data)), "application/json; charset=utf-8")
  revalidateTag(tag(slug), { expire: 0 })
}

/** A work's English text, by chapter position. Empty if the file is missing. */
export function readWorkText(slug: string): Promise<Map<number, string[]>> {
  return unstable_cache(
    async () => {
      const data = await readJson<WorkText>(key(slug, "en"))
      return (data?.sections ?? []).map(s => [s.position, s.paragraphs] as const)
    },
    ["library-en", slug],
    { tags: [tag(slug)], revalidate: DAY },
  )().then(entries => new Map(entries))
}

/** A work's Amharic translation, every chapter that has one, approved or not. */
export function readWorkAmharic(slug: string): Promise<Map<number, AmharicChapter>> {
  return unstable_cache(
    async () => (await readJson<WorkAmharic>(key(slug, "am")))?.sections ?? [],
    ["library-am", slug],
    { tags: [tag(slug)], revalidate: DAY },
  )().then(sections => new Map(sections.map(s => [s.position, s])))
}

/** The approved Amharic only, which is all a reader is shown. */
export async function readApprovedAmharic(slug: string): Promise<Map<number, AmharicChapter>> {
  const all = await readWorkAmharic(slug)
  return new Map([...all].filter(([, c]) => c.approved))
}

export async function writeWorkText(slug: string, text: WorkText) {
  await writeJson(key(slug, "en"), text, slug)
}

/** Replace some chapters of the Amharic file, keeping the rest as they are. */
export async function updateWorkAmharic(slug: string, change: (chapters: Map<number, AmharicChapter>) => void) {
  // Read past the cache: an admin's edit must build on the file as it is now.
  const current = (await readJson<WorkAmharic>(key(slug, "am")))?.sections ?? []
  const chapters = new Map(current.map(c => [c.position, c]))
  change(chapters)
  await writeJson(key(slug, "am"), { sections: [...chapters.values()].sort((a, b) => a.position - b.position) }, slug)
}
