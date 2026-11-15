// The groups sermon topics sit in, in display order. Kept apart from
// lib/sermon-topics (database and Gemini) so pages in the browser can use it.
export const TOPIC_GROUPS = [
  { key: "feasts", am: "በዓላትና አጽዋማት", en: "Feasts & seasons" },
  { key: "life", am: "ክርስቲያናዊ ሕይወት", en: "Christian life" },
  { key: "guidance", am: "መንፈሳዊ ምክር", en: "Guidance" },
  { key: "saints", am: "ቅዱሳንና አበው", en: "Saints & fathers" },
  { key: "doctrine", am: "ትምህርተ ሃይማኖት", en: "Faith & doctrine" },
] as const
