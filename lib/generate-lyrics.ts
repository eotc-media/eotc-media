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

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_TIMEOUT_MS = 55_000

/**
 * Run `prompt` against a YouTube video and return the model's text.
 * Throws with a readable message on misconfiguration, timeout, or API error.
 */
export async function generateFromYoutubeVideo(videoId: string, prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`)
  }

  const data = await res.json()
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('')
    .trim()

  if (!text) throw new Error('The model returned no text for this video.')
  return text
}

/** Strip ```html fences the model sometimes wraps output in. */
export function stripCodeFence(text: string): string {
  return text.replace(/^```(?:html)?\n?/i, '').replace(/\n?```$/i, '').trim()
}
