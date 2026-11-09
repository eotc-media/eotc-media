import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODEL } from "@/lib/gemini"

// AI lyrics are checked twice before they are saved:
//
// 1. The transcriber (lib/generate-lyrics, listening to the video) may answer
//    "unclear" or "no_lyrics" instead of guessing, and must re-check its own
//    lines before answering.
// 2. A separate reviewer reads only the text, as a fluent speaker would, and
//    judges whether it is real, coherent language that makes sense as a hymn.
//    It cannot hear the video, so it never rewrites anything; it only decides
//    whether the transcript is good enough to show.

export interface HymnContext { title: string; singers: string[]; languages: string[] }

export function transcriptionPrompt(ctx: HymnContext): string {
  return `You are transcribing the sung lyrics of an Ethiopian or Eritrean Orthodox Tewahedo hymn (mezmur) from this video.

Context from the site (may be incomplete; the title often contains the first line or the refrain):
- Title: ${ctx.title}
- Singer: ${ctx.singers.join(", ") || "unknown"}
- Language: ${ctx.languages.join(", ") || "unknown (most likely Amharic)"}

How to transcribe:
- Write what is sung, in its own language and script. Do not translate.
- Use correct standard spelling (for Amharic and Tigrinya, proper Ge'ez fidel). Every word must be a real word.
- Where a word is hard to hear, choose the real word that fits the sound, the rest of the line and the meaning of the hymn. Never write a phonetic approximation that is not a word.
- Use the title and Orthodox hymn vocabulary (names of God, the Virgin Mary, saints, scripture) to resolve unclear words.
- Leave out spoken introductions, announcements, credits and ad-libs.
- Write each stanza once in a <p>, with <br> between lines. Write the refrain in full the first time; when it repeats, write it again only if its words change.

Before answering, go through every line again against the audio and fix any line that is not real, meaningful language.

If you cannot make out most of the words with confidence, or the video has no sung lyrics, say so rather than guessing.

Answer with JSON only:
{"status": "ok" | "unclear" | "no_lyrics", "lyrics_html": "<p>...</p>"}
lyrics_html must be empty unless status is "ok".`
}

export interface TranscriptVerdict { ok: boolean; reason: string }

/** The second opinion: is this coherent, meaningful text in its language? */
export async function reviewTranscript(lyricsText: string, ctx: HymnContext): Promise<TranscriptVerdict> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, reason: "GEMINI_API_KEY is not configured" }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  })
  const prompt = `You are a fluent reader of Amharic, Tigrinya, Afaan Oromo and English, and know Ethiopian Orthodox Tewahedo hymns.

Below is a machine transcription of the hymn "${ctx.title}". Judge it as text:
- Are the lines made of real words, correctly spelled, in one consistent language?
- Do the lines make sense, grammatically and in meaning, as a religious hymn?
- Are there lines that look like sounds written down rather than words?

Answer with JSON only:
{"coherent": true | false, "nonsense_lines": <number of lines that are not real or meaningful language>, "total_lines": <number of lines>, "reason": "<one short sentence>"}

Transcription:
${lyricsText}`

  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("review timed out")), 15_000)),
    ])
    const v = JSON.parse(result.response.text()) as { coherent?: boolean; nonsense_lines?: number; total_lines?: number; reason?: string }
    const total = Math.max(1, Number(v.total_lines) || 1)
    const bad = Math.max(0, Number(v.nonsense_lines) || 0)
    // A stray unclear word is something a member can fix with "Edit"; a
    // transcript where more than one line in ten is noise is not worth showing.
    const ok = v.coherent === true && bad / total <= 0.1
    return { ok, reason: v.reason ?? "" }
  } catch (err) {
    return { ok: false, reason: `review failed: ${err instanceof Error ? err.message : String(err)}` }
  }
}

/** Plain text of the HTML, a line per <br> or paragraph, for the reviewer and the length check. */
export function lyricsToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
