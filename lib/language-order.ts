// Canonical display order for Ethiopian Bible/church languages.
// Anything not listed falls back to the end, sorted alphabetically.
// Aliases cover both spelling variants (Geez/Ge'ez, Tigrigna/Tigrinya,
// Afaan Oromo/Oromifa) and the native-script names actually stored in the
// database — without those, entries like "አማርኛ" match nothing and sort last.
const ORDER: string[] = ["amharic", "english", "geez", "tigrigna", "oromo"]

const ALIASES: Record<string, string> = {
  // Latin
  "english": "english",
  "amharic": "amharic",
  "geez": "geez",
  "ge'ez": "geez",
  "giiz": "geez",
  "gees": "geez",
  "tigrigna": "tigrigna",
  "tigrinya": "tigrigna",
  "tigrina": "tigrigna",
  "afaan oromo": "oromo",
  "afaan oromoo": "oromo",
  "afan oromo": "oromo",
  "oromo": "oromo",
  "oromifa": "oromo",
  "oromiffa": "oromo",
  "oromigna": "oromo",
  // Ge'ez script
  "አማርኛ": "amharic",
  "ኣምሓርኛ": "amharic",
  "እንግሊዝኛ": "english",
  "ግዕዝ": "geez",
  "ትግርኛ": "tigrigna",
  "ኦሮምኛ": "oromo",
  "ኦሮሚኛ": "oromo",
  "አፋን ኦሮሞ": "oromo",
}

function rank(name: string): number {
  const key = ALIASES[name.trim().toLowerCase()] ?? name.trim().toLowerCase()
  const idx = ORDER.indexOf(key)
  return idx === -1 ? ORDER.length : idx
}

export function sortLanguages<T extends { name: string }>(languages: T[]): T[] {
  return [...languages].sort((a, b) => {
    const ra = rank(a.name)
    const rb = rank(b.name)
    if (ra !== rb) return ra - rb
    return a.name.localeCompare(b.name)
  })
}
