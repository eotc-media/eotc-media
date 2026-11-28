// Lyrics/description generation reads the video with Gemini directly, by handing
// it the YouTube URL.
//
// This replaced subtitle scraping (youtube-transcript). That approach worked on
// the old shared host but not here: YouTube blocks its timedtext endpoint from
// datacenter IP ranges, which is exactly what Vercel functions run on, so every
// production request came back empty. Reading the video through Gemini needs no
// proxy, and also works for videos that have no subtitles at all.
//
// Caveats: the video must be public or unlisted, and only one video per request.

import { GEMINI_MEDIA_MODEL } from '@/lib/gemini'

const GEMINI_TIMEOUT_MS = 55_000

/** Gemini is overloaded or rate-limited: worth trying again a little later. */
export class GeminiBusyError extends Error {}

const BUSY = new Set([429, 500, 503])
/** Waits before the 2nd and 3rd attempt when Gemini says it is busy. */
const RETRY_DELAYS_MS = [2_000, 5_000]
/** Only retry while there is still time for a full attempt. */
const RETRY_UNTIL_MS = 25_000

/**
 * Run `prompt` against a YouTube video and return the model's text.
 * When Gemini answers that it is busy (it does so at once), it is asked again
 * up to twice; if it is still busy, a GeminiBusyError is thrown.
 * Throws with a readable message on misconfiguration, timeout, or API error.
 */
export async function generateFromYoutubeVideo(
  videoId: string,
  prompt: string,
  opts: { json?: boolean } = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const started = Date.now()
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MEDIA_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { file_data: { file_uri: `https://www.youtube.com/watch?v=${videoId}` } },
                  { text: prompt },
                ],
              },
            ],
            // Transcription wants the likeliest words, not creative ones.
            generationConfig: {
              temperature: 0.2,
              ...(opts.json ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        }
      )
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('The video took too long to process. Try a shorter video.')
      }
      throw err
    } finally {
      clearTimeout(timer)
    }

    if (BUSY.has(res.status)) {
      const delay = RETRY_DELAYS_MS[attempt]
      if (delay !== undefined && Date.now() - started + delay < RETRY_UNTIL_MS) {
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw new GeminiBusyError('The service is busy right now. Please try again in a few minutes.')
    }
    if (!res.ok) {
      // The provider's reply goes to the log only; members see a plain message.
      const detail = await res.text().catch(() => '')
      console.error('[generate] AI request failed', res.status, detail.slice(0, 300))
      throw new Error('The AI service could not process this video right now. Please try again later.')
    }

    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim()

    if (!text) throw new Error('No text came back for this video. Please try again later.')
    return text
  }
}

/** Strip ```html fences the model sometimes wraps output in. */
export function stripCodeFence(text: string): string {
  return text.replace(/^```(?:html)?\n?/i, '').replace(/\n?```$/i, '').trim()
}
