import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import { LiturgyReader } from "@/components/liturgy/LiturgyReader"

// Rendered per request, and read live so an admin edit shows up immediately —
// the same behaviour as the hymn, sermon and book pages. (This content was
// previously held in a 30-minute unstable_cache to cut database egress, which
// meant edits took up to an hour to appear.)
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Liturgy (Kidase) — Ethiopian Orthodox Divine Liturgy | ቅዳሴ",
  description:
    "Follow the Ethiopian Orthodox Tewahedo Church Divine Liturgy (Kidase) texts with role-by-role readings. " +
    "የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን የቅዳሴ ጸሎቶች እና ሥርዓት።",
  keywords: [
    "Ethiopian Orthodox liturgy", "Kidase", "Divine Liturgy Ethiopia", "Orthodox Tewahedo Kidase",
    "ቅዳሴ", "ሥርዓተ ቅዳሴ", "የቅዳሴ ጸሎቶች",
  ],
  alternates: { canonical: "/liturgy" },
  openGraph: {
    title: "Liturgy (Kidase) — Ethiopian Orthodox Divine Liturgy | ቅዳሴ",
    description: "Follow the EOTC Divine Liturgy (Kidase) texts. ሥርዓተ ቅዳሴ።",
    url: "/liturgy",
  },
}

async function getLiturgyData() {
  const [sections, roles] = await Promise.all([
    prisma.ltSection.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        texts: {
          orderBy: { orderIndex: "asc" },
          include: { role: true },
        },
      },
    }),
    prisma.ltRole.findMany({
      orderBy: { orderIndex: "asc" },
    }),
  ])

  return { sections, roles }
}

export default async function LiturgyPage() {
  const { sections, roles } = await getLiturgyData()

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16">
        <LiturgyReader sections={sections} roles={roles} />
      </div>
    </div>
  )
}
