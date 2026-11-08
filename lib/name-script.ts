import { unstable_cache } from "next/cache"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODEL } from "@/lib/gemini"

// The greeting shows the visitor's first name in the alphabet of the language
// they chose: "Fasil" reads ፋሲል in Amharic, and ፋሲል reads Fasil in English.
// Names are spelled by Gemini and kept in Next's data cache for a day, so a name
// costs at most one model call a day however often it is greeted. A failed call
// is cached too, as "no spelling": the greeting then shows the name as written,
// and a slow or broken model never holds up every page view.

const ETHIOPIC = /[\u1200-\u139F\u2D80-\u2DDF]/
const ONLY_ETHIOPIC = /^[\u1200-\u139F\u2D80-\u2DDF\s]+$/
const ONLY_LATIN = /^[A-Za-z][A-Za-z' .-]*$/
const TIMEOUT_MS = 3000

const respell = unstable_cache(
  async (name: string, to: "ethiopic" | "latin"): Promise<string | null> => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return null
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: GEMINI_MODEL })
    const prompt = to === "ethiopic"
      ? `Write the personal name "${name}" in Ge'ez (Ethiopic) script, spelled the way an Amharic speaker would write it. Reply with the name only.`
      : `Write the personal name "${name}" in Latin letters, spelled the way it is usually written in English. Reply with the name only.`
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
      ])
      const text = result.response.text().trim().split("\n")[0].trim()
      const ok = text.length > 0 && text.length <= 40 && (to === "ethiopic" ? ONLY_ETHIOPIC : ONLY_LATIN).test(text)
      if (ok) return text
      console.error("name respelling: unusable reply:", text.slice(0, 60))
    } catch (err) {
      console.error("name respelling failed:", err instanceof Error ? err.message : err)
    }
    return null
  },
  ["name-respell-v1"],
  { revalidate: 60 * 60 * 24 },
)

/** The first name in both alphabets; the side it was not written in is spelled for it. */
export async function nameInBothScripts(name: string): Promise<{ am: string; en: string }> {
  const isEthiopic = ETHIOPIC.test(name)
  const other = await respell(name, isEthiopic ? "latin" : "ethiopic").catch(() => null)
  if (!other) return { am: name, en: name }
  return isEthiopic ? { am: name, en: other } : { am: other, en: name }
}
