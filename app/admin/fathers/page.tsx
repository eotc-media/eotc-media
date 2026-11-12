import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/admin/shared/PageHeader"

export default async function AdminFathersPage() {
  const works = await prisma.cfWork.findMany({
    orderBy: { position: "asc" },
    select: {
      slug: true, title: true, author: true,
      sections: { select: { bodyAm: true, bodyAmApproved: true } },
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Church Fathers"
        description="Amharic translations: make them with scripts/fathers/translate.mjs and Gemini CLI, upload the file on a book's page, then review and approve each chapter. Only approved chapters are shown to readers."
      />
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
            {works.map(w => {
              const translated = w.sections.filter(s => s.bodyAm).length
              const approved = w.sections.filter(s => s.bodyAmApproved).length
              return (
                <tr key={w.slug} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/fathers/${w.slug}`} className="font-medium text-blue-600 hover:underline">{w.title}</Link>
                    <p className="text-xs text-muted-foreground">{w.author} · <code>{w.slug}</code></p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{w.sections.length}</td>
                  <td className="px-4 py-3 tabular-nums">{translated}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {approved === w.sections.length ? <span className="font-medium text-emerald-600">All</span> : approved}
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
