const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export interface YoutubeVideoData {
  videoId: string
  title: string
  channelId: string
  publishedAt: string
  thumbnailDefault: string
  thumbnailMedium: string
  thumbnailHigh: string
  thumbnailStandard: string | null
  thumbnailMaxres: string | null
}

export interface YoutubeChannelData {
  ytChannelId: string
  title: string
  description: string
  handle: string
  publishedAt: string
  thumbnailDefault: string
  thumbnailMedium: string
  thumbnailHigh: string
  coverImage: string | null
  country: string | null
  keywords: string | null
}

export function extractVideoId(url: string): string | null {
  // Accept raw video ID (11 chars, no slashes)
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim()
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const match = u.pathname.match(/\/(embed|shorts|v)\/([^/?]+)/)
      if (match) return match[2]
    }
  } catch {}
  return null
}

export async function fetchYoutubeVideo(videoId: string): Promise<YoutubeVideoData> {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not configured')

  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)

  const data = await res.json()
  const item = data.items?.[0]
  if (!item) throw new Error('Video not found')

  const s = item.snippet
  const t = s.thumbnails

  return {
    videoId,
    title: s.title,
    channelId: s.channelId,
    publishedAt: s.publishedAt,
    thumbnailDefault: t.default?.url ?? '',
    thumbnailMedium: t.medium?.url ?? '',
    thumbnailHigh: t.high?.url ?? '',
    thumbnailStandard: t.standard?.url ?? null,
    thumbnailMaxres: t.maxres?.url ?? null,
  }
}

/**
 * Fetch many videos in one shot. The YouTube API accepts up to 50 comma-
 * separated ids per call, so this uses ⌈N/50⌉ requests total. Videos missing
 * from the response (deleted / private / removed) simply won't appear in the
 * returned map — callers use that to detect unavailable videos.
 */
export async function fetchYoutubeVideosBatch(
  videoIds: string[]
): Promise<Map<string, YoutubeVideoData>> {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not configured')
  const result = new Map<string, YoutubeVideoData>()
  const unique = [...new Set(videoIds.filter(Boolean))]

  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50)
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}&part=snippet&maxResults=50`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)
    const data = await res.json()
    for (const item of data.items ?? []) {
      const s = item.snippet
      const t = s.thumbnails ?? {}
      result.set(item.id, {
        videoId: item.id,
        title: s.title,
        channelId: s.channelId,
        publishedAt: s.publishedAt,
        thumbnailDefault: t.default?.url ?? '',
        thumbnailMedium: t.medium?.url ?? '',
        thumbnailHigh: t.high?.url ?? '',
        thumbnailStandard: t.standard?.url ?? null,
        thumbnailMaxres: t.maxres?.url ?? null,
      })
    }
  }
  return result
}

export async function fetchYoutubeChannel(channelId: string): Promise<YoutubeChannelData> {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not configured')

  const url = `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&key=${YOUTUBE_API_KEY}&part=snippet,brandingSettings`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)

  const data = await res.json()
  const item = data.items?.[0]
  if (!item) throw new Error('Channel not found')

  const s = item.snippet
  const t = s.thumbnails
  const brands = item.brandingSettings

  return {
    ytChannelId: channelId,
    title: s.title,
    description: s.description ?? '',
    handle: s.customUrl ?? '',
    publishedAt: s.publishedAt,
    thumbnailDefault: t.default?.url ?? '',
    thumbnailMedium: t.medium?.url ?? '',
    thumbnailHigh: t.high?.url ?? '',
    coverImage: brands?.image?.bannerExternalUrl ?? null,
    country: s.country ?? null,
    keywords: brands?.channel?.keywords ?? null,
  }
}

/** The newest uploads of a channel (its "uploads" playlist), newest first. */
export async function fetchRecentUploads(ytChannelId: string, max = 10): Promise<{ videoId: string; publishedAt: string }[]> {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not configured')
  // A channel's uploads playlist is its id with "UC" turned into "UU".
  const playlist = ytChannelId.replace(/^UC/, 'UU')
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlist}&key=${YOUTUBE_API_KEY}&part=contentDetails&maxResults=${max}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)
  const data = await res.json()
  return (data.items ?? [])
    .map((i: { contentDetails?: { videoId?: string; videoPublishedAt?: string } }) => ({
      videoId: i.contentDetails?.videoId ?? '',
      publishedAt: i.contentDetails?.videoPublishedAt ?? '',
    }))
    .filter((v: { videoId: string }) => v.videoId)
}

export interface YoutubeVideoDetails extends YoutubeVideoData {
  description: string
  durationSeconds: number
  /** "none" for an ordinary video; "live" or "upcoming" for a broadcast. */
  liveBroadcastContent: string
}

/** Title, description, length and thumbnails of many videos (50 per request). */
export async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, YoutubeVideoDetails>> {
  if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY is not configured')
  const result = new Map<string, YoutubeVideoDetails>()
  const unique = [...new Set(videoIds.filter(Boolean))]
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50)
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails&maxResults=50`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`YouTube API error: ${res.status}`)
    const data = await res.json()
    for (const item of data.items ?? []) {
      const s = item.snippet
      const t = s.thumbnails ?? {}
      result.set(item.id, {
        videoId: item.id,
        title: s.title,
        description: s.description ?? '',
        channelId: s.channelId,
        publishedAt: s.publishedAt,
        liveBroadcastContent: s.liveBroadcastContent ?? 'none',
        durationSeconds: isoDurationSeconds(item.contentDetails?.duration ?? ''),
        thumbnailDefault: t.default?.url ?? '',
        thumbnailMedium: t.medium?.url ?? '',
        thumbnailHigh: t.high?.url ?? '',
        thumbnailStandard: t.standard?.url ?? null,
        thumbnailMaxres: t.maxres?.url ?? null,
      })
    }
  }
  return result
}

/** "PT1H2M3S" → 3723. */
export function isoDurationSeconds(d: string): number {
  const m = d.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return 0
  const [, days, h, min, s] = m.map(x => Number(x) || 0)
  return days * 86400 + h * 3600 + min * 60 + s
}
