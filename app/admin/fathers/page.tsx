import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { readWorkAmharic } from "@/lib/library"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import LibraryImport from "./LibraryImport"

export default async function AdminFathersPage() {
  const works = await prisma.cfWork.findMany({
    orderBy: { position: "asc" },
    select: { slug: true, title: true, author: true, collection: true, _count: { select: { sections: true } } },
  })
  const amharic = await Promise.all(works.map(w => readWorkAmharic(w.slug)))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Church Fathers"
        description="The library's text lives in R2; the database keeps the index. Add works with a library file from scripts/fathers/to_bundle.py. Translate with scripts/fathers/translate.mjs and Gemini CLI, upload the file on a book's page, then review and approve each chapter. Only approved chapters are shown to readers."
      />
      <LibraryImport />
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Book</th>
              <th className="px-4 py-3">Chapters</th>
              <th className="px-4 py-3">Translated</th>
              <th className="px-4 py-3">Approved</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {works.map((w, i) => {
              const chapters = [...amharic[i].values()]
              const approved = chapters.filter(c => c.approved).length
              return (
                <tr key={w.slug} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/fathers/${w.slug}`} className="font-medium text-blue-600 hover:underline">{w.title}</Link>
                    <p className="text-xs text-muted-foreground">{w.author} · {w.collection} · <code>{w.slug}</code></p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{w._count.sections}</td>
                  <td className="px-4 py-3 tabular-nums">{chapters.length}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {approved === w._count.sections ? <span className="font-medium text-emerald-600">All</span> : approved}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
