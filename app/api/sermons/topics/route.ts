import { NextResponse } from "next/server"
import { getTopics, TOPIC_GROUPS } from "@/lib/sermon-topics"

// The topic list, for the Add a sermon form.
export async function GET() {
  return NextResponse.json({ groups: TOPIC_GROUPS, topics: await getTopics() })
}
