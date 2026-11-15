import { redirect } from "next/navigation"

export default async function ShelfPreview({ params }: { params: Promise<{ key: string }> }) {
  redirect(`/books/shelf/${(await params).key}`)
}
