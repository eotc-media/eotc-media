import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"
import { GEMINI_MODEL } from "@/lib/gemini"

// Each member's name is kept in both alphabets (users.name_am, users.name_en),
// so the greeting reads "Fasil" in English and "ፋሲል" in Amharic. The name they
// wrote fills its own side; the other side is spelled by Gemini once, saved,
// and from then on simply read. A member can correct either on their profile.

const ETHIOPIC = /[ሀ-᎟ⶀ-⷟]/
const ONLY_ETHIOPIC = /^[ሀ-᎟ⶀ-⷟\s.'-]+$/
const ONLY_LATIN = /^[A-Za-z][A-Za-z' .-]*$/
const TIMEOUT_MS = 10_000

export const isEthiopicName = (name: string) => ETHIOPIC.test(name)

/** The name in the other alphabet, or null if Gemini gave nothing usable. */
async function respell(name: string, to: "ethiopic" | "latin"): Promise<string | null> {
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
    const ok = text.length > 0 && text.length <= 100 && (to === "ethiopic" ? ONLY_ETHIOPIC : ONLY_LATIN).test(text)
    if (ok) return text
    console.error("name spelling: unusable reply:", text.slice(0, 60))
  } catch (err) {
    console.error("name spelling failed:", err instanceof Error ? err.message : err)
  }
  return null
}

/**
 * Make sure the member has their name in both alphabets, spelling the missing
 * side once. Safe to call repeatedly: it does nothing when both are present.
 */
export async function fillNameScripts(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, nameAm: true, nameEn: true } })
  if (!user?.name.trim()) return
  const name = user.name.trim()
  const ethiopic = isEthiopicName(name)

  const data: { nameAm?: string; nameEn?: string } = {}
  if (ethiopic && !user.nameAm) data.nameAm = name
  if (!ethiopic && !user.nameEn) data.nameEn = name
  if (ethiopic ? !user.nameEn : !user.nameAm) {
    const other = await respell(name, ethiopic ? "latin" : "ethiopic")
    if (other) data[ethiopic ? "nameEn" : "nameAm"] = other
  }
  if (Object.keys(data).length) await prisma.user.update({ where: { id: userId }, data })
}

/** The first name to greet with, in the reader's alphabet where we have it. */
export function greetingNames(user: { name: string; nameAm: string | null; nameEn: string | null }): { am: string; en: string } {
  const first = (n: string | null | undefined) => n?.trim().split(/\s+/)[0] || null
  const fallback = first(user.name) ?? ""
  return { am: first(user.nameAm) ?? fallback, en: first(user.nameEn) ?? fallback }
}
