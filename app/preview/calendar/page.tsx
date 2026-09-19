import type { Metadata } from "next"
import Navbar from "@/components/Navbar"
import EthiopianCalendar from "@/components/today/EthiopianCalendar"
import { todayUTC } from "@/lib/ethiopian-calendar"

// Preview of the Ethiopian calendar page. Kept under /preview and out of
// search results until it is finished; moving it to /calendar afterwards is a
// rename and a metadata change.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ethiopian calendar — preview",
  robots: { index: false, follow: false },
}

export default async function CalendarPreviewPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 pt-16">
        <EthiopianCalendar todayIso={todayUTC().toISOString()} />
      </main>
    </>
  )
}
