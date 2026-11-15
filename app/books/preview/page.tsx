import { redirect } from "next/navigation"

// The redesign was previewed here before it became the Books section.
export default function LibraryPreview() {
  redirect("/books")
}
