import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // Share short links. They only redirect to the canonical page, which
          // is in the sitemap already, so crawling them adds nothing — but
          // there are thousands, each costs a database round trip, and Google
          // had accumulated 1,470 of them as "Server error (5xx)".
          "/h/",
          "/s/",
          "/admin/",
          "/auth/",
          "/profile",
          "/bible/collections",
          "/hymns/collections",
          "/hymns/favorites",
          "/hymns/my-hymns",
          "/hymns/admin/",
          "/hymns/submit",
          "/sermons/favorites",
          "/sermons/my-sermons",
          "/sermons/admin/",
          "/sermons/submit",
          "/books/my-books",
          "/books/admin/",
          "/books/submit",
          "/liturgy/favorites",
          "/liturgy/admin/",
          "/quiz/my-questions",
          "/quiz/admin/",
          "/quiz/submit",
          "/quiz/rooms",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
