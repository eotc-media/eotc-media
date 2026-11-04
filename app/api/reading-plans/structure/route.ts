import { NextResponse } from "next/server"
import { getBibleStructure } from "@/lib/reading-plan-server"

// Every book and chapter's verse count, for the plan builder to preview plans
// in the browser. Fetched only when someone opens the builder, and identical
// for everyone, so it can be cached hard.
export async function GET() {
  const structure = await getBibleStructure()
  return NextResponse.json(structure, {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
  })
}
