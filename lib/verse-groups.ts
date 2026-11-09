// Some translations, the Amharic 1954 above all, render two or more verses as
// one: the earlier numbers exist with no text (or only a "።"), and the words
// sit on the last. Shown verse by verse, those empty numbers are merged into
// the verse that carries the text and labelled "2–3".

// Ethiopic and common punctuation alone counts as empty.
const PUNCT_ONLY_RE = /^[\s፠-፨!?,.;:·÷\-_]+$/

export function hasTextContent(text: string | null | undefined): boolean {
  if (!text) return false
  const trimmed = text.trim()
  return trimmed.length > 0 && !PUNCT_ONLY_RE.test(trimmed)
}

export interface VerseGroup<T> {
  items: T[]          // every verse in the group, in order
  nums: number[]      // their numbers, e.g. [2, 3]
  label: string       // "3", or "2–3" for a merged group
  text: string | null // the text, from the last verse; null if none has any
}

/** Merge each run of empty verses into the next verse that has text. */
export function buildVerseGroups<T extends { verse: number }>(verses: T[], textOf: (v: T) => string | null | undefined): VerseGroup<T>[] {
  const groups: VerseGroup<T>[] = []
  let buffer: T[] = []
  const push = (items: T[], text: string | null) => {
    const nums = items.map(v => v.verse)
    groups.push({ items, nums, text, label: nums.length === 1 ? String(nums[0]) : `${nums[0]}–${nums[nums.length - 1]}` })
  }

  for (const v of verses) {
    const text = textOf(v)
    if (!hasTextContent(text)) {
      buffer.push(v)
    } else {
      push([...buffer, v], text ?? null)
      buffer = []
    }
  }
  // Empty verses at the very end have nothing to merge into.
  if (buffer.length > 0) push(buffer, null)
  return groups
}
