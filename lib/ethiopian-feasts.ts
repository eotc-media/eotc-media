// ── NEEDS REVIEW ─────────────────────────────────────────────────────────────
//
// Everything in this file is a DRAFT written from general knowledge, not from a
// church source. The arithmetic in lib/ethiopian-calendar.ts is exact and needs
// no checking; this does. A wrong saint on a wrong day is worse than no page at
// all, so the Today page shows a review banner and stays out of search results
// until REVIEWED is flipped to true.
//
// Confidence varies a lot by entry. The monthly days I am most sure of are
// 12 (ሚካኤል), 16 (ኪዳነ ምሕረት), 19 (ገብርኤል), 21 (ማርያም), 22 (ዑራኤል),
// 23 (ጊዮርጊስ), 24 (ተክለ ሃይማኖት), 27 (መድኃኔ ዓለም), 28 (አማኑኤል), 29 (በዓለ ወልድ).
// The rest — and the second name on days that carry more than one — want the
// closest reading. Movable-feast offsets are stated in days from ትንሣኤ so a
// reviewer can correct a date by correcting one number.
//
// ─────────────────────────────────────────────────────────────────────────────

/** Flip to true once a priest or knowledgeable reviewer has been through this file. */
export const REVIEWED = false

export interface Named {
  am: string
  en: string
}

/** ወርኃዊ በዓላት — falls on this day of every Ge'ez month. */
export const MONTHLY_COMMEMORATIONS: Record<number, Named[]> = {
  1:  [{ am: "ልደታ ለማርያም", en: "Nativity of St Mary" }],
  2:  [{ am: "ቅዱስ ታዴዎስ ሐዋርያ", en: "St Thaddeus the Apostle" }],
  3:  [{ am: "በዓታ ለማርያም", en: "Presentation of St Mary" }],
  4:  [{ am: "ቅዱስ ዮሐንስ ወንጌላዊ", en: "St John the Evangelist" }],
  5:  [{ am: "አቡነ ገብረ መንፈስ ቅዱስ", en: "Abune Gebre Menfes Kidus" }],
  6:  [{ am: "ቅዱስ ኢያሪቆስ", en: "St Iyaricos" }],
  7:  [{ am: "ሥላሴ", en: "The Holy Trinity" }],
  8:  [{ am: "አርባዕቱ እንስሳ", en: "The Four Living Creatures" }],
  9:  [{ am: "ቅዱስ ቶማስ ሐዋርያ", en: "St Thomas the Apostle" }],
  10: [{ am: "መስቀለ ክርስቶስ", en: "The Cross of Christ" }],
  11: [{ am: "ሐና ወኢያቄም", en: "Hanna and Iyaqem" }],
  12: [{ am: "ቅዱስ ሚካኤል ሊቀ መላእክት", en: "St Michael the Archangel" }],
  13: [{ am: "ቅዱስ ሩፋኤል ሊቀ መላእክት", en: "St Raphael the Archangel" }],
  14: [{ am: "አቡነ አረጋዊ", en: "Abune Aregawi" }],
  15: [{ am: "ቅዱስ ቂርቆስ ወኢየሉጣ", en: "St Cyricus and Julitta" }],
  16: [{ am: "ኪዳነ ምሕረት", en: "Kidane Mihret — Covenant of Mercy" }],
  17: [{ am: "ቅዱስ እስጢፋኖስ", en: "St Stephen" }],
  18: [{ am: "ቅዱስ ፊልጶስ ሐዋርያ", en: "St Philip the Apostle" }],
  19: [{ am: "ቅዱስ ገብርኤል ሊቀ መላእክት", en: "St Gabriel the Archangel" }],
  20: [{ am: "ሕንፀተ ቤተ ክርስቲያን", en: "Consecration of the Church" }],
  21: [{ am: "ቅድስት ድንግል ማርያም", en: "St Mary the Virgin" }],
  22: [{ am: "ቅዱስ ዑራኤል ሊቀ መላእክት", en: "St Uriel the Archangel" }],
  23: [{ am: "ቅዱስ ጊዮርጊስ", en: "St George" }],
  24: [{ am: "አቡነ ተክለ ሃይማኖት", en: "Abune Tekle Haymanot" }],
  25: [{ am: "ቅዱስ መርቆሬዎስ", en: "St Mercurius" }],
  26: [{ am: "ቅዱስ ዮሴፍ", en: "St Joseph" }],
  27: [{ am: "መድኃኔ ዓለም", en: "Medhane Alem — Saviour of the World" }],
  28: [{ am: "አማኑኤል", en: "Emmanuel" }],
  29: [{ am: "በዓለ ወልድ", en: "Feast of the Son" }],
  30: [{ am: "ቅዱስ ዮሐንስ መጥምቅ", en: "St John the Baptist" }],
}

export interface FixedFeast extends Named {
  /** Ge'ez month, 1 = መስከረም. */
  month: number
  day: number
  major?: boolean
}

/** በዓላት that fall on the same Ge'ez date every year. */
export const FIXED_FEASTS: FixedFeast[] = [
  { month: 1,  day: 1,  am: "እንቁጣጣሽ — ርእሰ ዓውደ ዓመት", en: "Ethiopian New Year", major: true },
  { month: 1,  day: 17, am: "መስቀል", en: "Finding of the True Cross", major: true },
  { month: 3,  day: 6,  am: "ደብረ ምጥማቅ", en: "Debre Mitmaq" },
  { month: 4,  day: 29, am: "ገና — ልደተ ክርስቶስ", en: "Ethiopian Christmas", major: true },
  { month: 5,  day: 11, am: "ጥምቀት", en: "Epiphany", major: true },
  { month: 5,  day: 12, am: "ቃና ዘገሊላ", en: "Wedding at Cana" },
  { month: 6,  day: 8,  am: "ቅዱስ ገብርኤል", en: "St Gabriel" },
  { month: 10, day: 21, am: "ቅዱስ ጴጥሮስ ወጳውሎስ", en: "Sts Peter and Paul" },
  { month: 12, day: 13, am: "ደብረ ታቦር — ቡሄ", en: "Transfiguration", major: true },
  { month: 12, day: 16, am: "ፍልሰታ ለማርያም", en: "Assumption of St Mary", major: true },
]

export interface MovableFeast extends Named {
  /** Days from ትንሣኤ. Negative is before. */
  offset: number
  major?: boolean
}

/** በዓላት that move with ትንሣኤ. */
export const MOVABLE_FEASTS: MovableFeast[] = [
  { offset: -69, am: "ጾመ ነነዌ", en: "Fast of Nineveh", major: true },
  { offset: -55, am: "ዐቢይ ጾም ይጀምራል", en: "Great Lent begins", major: true },
  { offset: -21, am: "ደብረ ዘይት", en: "Debre Zeit" },
  { offset: -7,  am: "ሆሳዕና", en: "Palm Sunday", major: true },
  { offset: -3,  am: "ጸሎተ ሐሙስ", en: "Maundy Thursday" },
  { offset: -2,  am: "ስቅለት", en: "Good Friday", major: true },
  { offset: 0,   am: "ትንሣኤ — ፋሲካ", en: "Easter", major: true },
  { offset: 7,   am: "ዳግም ትንሣኤ", en: "Second Resurrection" },
  { offset: 24,  am: "ርክበ ካህናት", en: "Rikbe Kahnat" },
  { offset: 39,  am: "ዕርገት", en: "Ascension", major: true },
  { offset: 49,  am: "በዓለ ጰራቅሊጦስ", en: "Pentecost", major: true },
  { offset: 50,  am: "ጾመ ሐዋርያት ይጀምራል", en: "Apostles' Fast begins" },
]

export type FastKind = "weekly" | "seasonal"

export interface FastSeason extends Named {
  kind: FastKind
}

/** Seasons defined by an offset window from ትንሣኤ. */
export const MOVABLE_FASTS: Array<FastSeason & { from: number; to: number }> = [
  { from: -69, to: -67, am: "ጾመ ነነዌ", en: "Fast of Nineveh", kind: "seasonal" },
  { from: -55, to: -1,  am: "ዐቢይ ጾም", en: "Great Lent", kind: "seasonal" },
]

/** Seasons defined by fixed Ge'ez dates. `to` may wrap past the year end. */
export const FIXED_FASTS: Array<FastSeason & {
  fromMonth: number; fromDay: number; toMonth: number; toDay: number
}> = [
  { fromMonth: 3, fromDay: 15, toMonth: 4, toDay: 28, am: "ጾመ ነቢያት", en: "Advent Fast", kind: "seasonal" },
  { fromMonth: 12, fromDay: 1, toMonth: 12, toDay: 16, am: "ጾመ ፍልሰታ", en: "Fast of the Assumption", kind: "seasonal" },
]

export const WEEKLY_FAST: FastSeason = {
  am: "ረቡዕ እና ዓርብ ጾም",
  en: "Wednesday and Friday fast",
  kind: "weekly",
}
