// Gemini models the app uses.
//
// GEMINI_MODEL: quick text tasks (voice search, verse corrections, name
// spelling, checking transcripts). Flash-Lite: free tier, most daily headroom.
export const GEMINI_MODEL = "gemini-3.5-flash-lite"

// GEMINI_MEDIA_MODEL: listening to whole videos (hymn lyrics, sermon
// descriptions). Sung Amharic is hard to hear; Flash-Lite turned lines into
// phonetic nonsense, so this uses full Flash. These run rarely, a few a day.
export const GEMINI_MEDIA_MODEL = "gemini-3.5-flash"
