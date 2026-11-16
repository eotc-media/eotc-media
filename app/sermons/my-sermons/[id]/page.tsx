import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Navbar from "@/components/Navbar"
import SermonSidebar from "@/components/sermons/SermonSidebar"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
  Accepted: { badge: "bg-green-100 text-green-700 border border-green-200", label: "Accepted" },
  Submitted: { badge: "bg-amber-100 text-amber-700 border border-amber-200", label: "Pending review" },
  Declined:  { badge: "bg-red-100 text-red-600 border border-red-200",       label: "Declined" },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MySermonDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")
  const userId = parseInt(session.user.id)

  const { id } = await params
  const sermonId = parseInt(id)
  if (!sermonId) notFound()

  const sermon = await prisma.smSermon.findFirst({
    where: { id: sermonId, userId },
    include: {
      approvalStatus: true,
      categories: { include: { category: true } },
      languages: { include: { language: true } },
      subCategories: { include: { subCategory: true } },
      preachers: { include: { preacher: true } },
      topics: { include: { topic: true }, orderBy: { id: "asc" } },
    },
  })
  if (!sermon) notFound()

  const statusName = (sermon.approvalStatus as { name: string } | null)?.name ?? "Submitted"
  const status = STATUS_STYLE[statusName] ?? { badge: "bg-slate-100 text-slate-600 border border-slate-200", label: statusName }

  const languages = (sermon.languages as { language: { id: number; name: string } }[])
  const categories = (sermon.categories as { category: { id: number; name: string } }[])
  const subCategories = (sermon.subCategories as { subCategory: { id: number; name: string } }[])
  const preachers = (sermon.preachers as { preacher: { id: number; name: string } }[])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
          <SermonSidebar userId={userId} />
          <main className="mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-10 py-8">
            <div className="max-w-2xl">
              <Link href="/sermons/my-sermons" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> My sermons
              </Link>

              {/* Card */}
              <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sermon.thumbnailHigh} alt="" className="aspect-video w-full bg-slate-100 object-cover" />

                <div className="p-6">

                  {/* Title + status badge */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <h1 className="text-lg font-semibold leading-snug tracking-tight text-slate-900">{sermon.title}</h1>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Meta rows */}
                  <dl className="space-y-3 mb-6">
                    {languages.length > 0 && (
                      <div className="flex gap-3">
                        <dt className="w-28 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Language</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {languages.map(l => (
                            <span key={l.language.id} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">{l.language.name}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {preachers.length > 0 && (
                      <div className="flex gap-3">
                        <dt className="w-28 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Preacher</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {preachers.map(p => (
                            <span key={p.preacher.id} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">{p.preacher.name}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {sermon.preacher && (
                      <div className="flex gap-3">
                        <dt className="w-28 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Preacher</dt>
                        <dd className="text-sm text-slate-700">{sermon.preacher as string}</dd>
                      </div>
                    )}
                    {sermon.topics.length > 0 && (
                      <div className="flex gap-3">
                        <dt className="w-28 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Topics</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {sermon.topics.map(t => (
                            <span key={t.id} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                              {t.topic.nameEn} · {t.topic.nameAm}{!t.approvedAt && <span className="text-blue-700/60"> (in review)</span>}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {sermon.topics.length === 0 && categories.length > 0 && (
                      <div className="flex gap-3">
                        <dt className="w-28 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Category</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {categories.map(c => (
                            <span key={c.category.id} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">{c.category.name}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {sermon.topics.length === 0 && subCategories.length > 0 && (
                      <div className="flex gap-3">
                        <dt className="w-28 shrink-0 text-xs font-semibold text-slate-400 uppercase tracking-wide pt-0.5">Subcategory</dt>
                        <dd className="flex flex-wrap gap-1.5">
                          {subCategories.map(sc => (
                            <span key={sc.subCategory.id} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 font-medium">{sc.subCategory.name}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="border-t border-slate-100" />

                  <div className="mt-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Description</p>
                    {sermon.description ? (
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{sermon.description as string}</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No description added</p>
                    )}
                  </div>

                  {statusName === "Accepted" && (
                    <Link href={`/sermons/${encodeURIComponent(sermon.slug)}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                      Open the sermon page <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}

                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
