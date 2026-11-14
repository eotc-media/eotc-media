import { bookImageUrl } from "@/lib/book-assets"

/** A cover that looks like a book: real proportions, a shadow, a hint of spine. */
export default function BookCover({ name, image, className = "", priority = false }: {
  name: string
  image: string | null
  className?: string
  priority?: boolean
}) {
  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-[3px] bg-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_10px_24px_-10px_rgba(60,40,20,0.45)] ${className}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bookImageUrl(image)}
          alt={name}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 p-3 text-center text-sm text-slate-100">
          {name}
        </div>
      )}
      {/* The spine: a soft fold of light down the left edge. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/20 via-white/10 to-transparent" />
    </div>
  )
}
