import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { presignPutUrl } from "@/lib/storage"

// Hands the browser a short-lived URL to upload one book file straight to R2.
//
// Vercel rejects a request body over 4.5 MB before the function runs, so a
// book's PDF could never reach /api/books/submit to be forwarded on — the
// upload failed with FUNCTION_PAYLOAD_TOO_LARGE and nothing of ours ran. The
// browser uploads to R2 itself now, and submit only receives the filename.
//
// The URL is signed for one exact key and content type, so it cannot be reused
// to write anywhere else in the bucket.

const KINDS = {
  files: { prefix: "books/files", types: ["application/pdf"], maxBytes: 50 * 1024 * 1024 },
  images: { prefix: "books/images", types: ["image/webp", "image/jpeg", "image/png"], maxBytes: 5 * 1024 * 1024 },
} as const

type Kind = keyof typeof KINDS

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { kind, contentType, size } = await req.json()

  const spec = KINDS[kind as Kind]
  if (!spec) return NextResponse.json({ error: "Unknown upload kind" }, { status: 400 })
  if (!(spec.types as readonly string[]).includes(contentType)) {
    return NextResponse.json({ error: `Unsupported file type: ${contentType}` }, { status: 400 })
  }
  if (typeof size !== "number" || size <= 0 || size > spec.maxBytes) {
    return NextResponse.json(
      { error: `File is too large (limit ${Math.round(spec.maxBytes / 1024 / 1024)} MB)` },
      { status: 400 }
    )
  }

  const filename = `book_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}.${EXT[contentType]}`
  const url = await presignPutUrl(`${spec.prefix}/${filename}`, contentType)

  return NextResponse.json({ url, filename })
}
