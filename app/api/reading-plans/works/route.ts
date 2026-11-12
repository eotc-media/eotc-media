import { NextResponse } from "next/server"
import { getWorkShelf } from "@/lib/reading-plan-server"

// The Church Fathers shelf with each chapter's word count, for the plan
// builder to preview plans in the browser. The same for everyone.
export async function GET() {
  return NextResponse.json(await getWorkShelf(), {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
  })
}
