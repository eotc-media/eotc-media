import Link from "next/link"
import { prisma } from "@/lib/prisma"
import BookApproveDeclineButtons from "@/components/admin/books/BookApproveDeclineButtons"
import { PageHeader } from "@/components/admin/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  Accepted: "success",
  Submitted: "warning",
  Declined: "destructive",
}

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>
}

export default async function AdminBooksPage({ searchParams }: PageProps) {
  const { status, page: pageParam, q } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const search = q?.trim() || undefined

  // The sidebar sends ?status=pending for "New books"; without reading it back
  // that entry listed every book in the library.
  const where: Record<string, unknown> = {}
  if (status === "pending") {
    where.approvalStatus = { name: "Submitted" }
  } else if (status === "approved") {
    where.approvalStatus = { name: "Accepted" }
  } else if (status === "rejected") {
    where.approvalStatus = { name: "Declined" }
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ]
  }

  const [books, total] = await Promise.all([
    prisma.cbBook.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      // Explicit columns, as the hymn list does: `include` pulled the book's
      // description for every row, which the table never shows.
      select: {
        id: true,
        slug: true,
        name: true,
        author: true,
        approvalStatus: { select: { id: true, name: true } },
        languages: { select: { language: { select: { id: true, name: true } } }, take: 3 },
        categories: { select: { category: { select: { id: true, name: true } } }, take: 2 },
        authors: { select: { author: { select: { id: true, name: true } } }, take: 3 },
      },
    }),
    prisma.cbBook.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const isPending = status === "pending"
  const pageTitle = isPending ? "New books" : "All books"

  function buildUrl(p: number) {
    const qs = [status && `status=${status}`, search && `q=${encodeURIComponent(search)}`]
      .filter(Boolean)
      .join("&")
    return `/books/admin/books?page=${p}${qs ? `&${qs}` : ""}`
  }

  const linkClass = "px-3 py-1.5 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader title={pageTitle} description={`${total.toLocaleString()} books`} />

      <form method="GET" action="/books/admin/books" className="flex items-center gap-2 max-w-sm">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by name or author…"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow]"
        />
        <button type="submit" className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">Search</button>
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">#</TableHead>
                <TableHead className="px-4">Language</TableHead>
                <TableHead className="px-4">Category</TableHead>
                <TableHead className="px-4">Name</TableHead>
                <TableHead className="px-4">Author</TableHead>
                <TableHead className="px-4">Status</TableHead>
                <TableHead className="px-4" />
                {isPending && (
                  <>
                    <TableHead className="px-4" />
                    <TableHead className="px-4" />
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isPending ? 9 : 7} className="px-4 py-10 text-center text-muted-foreground">No books</TableCell>
                </TableRow>
              )}
              {books.map((book, i) => (
                <TableRow key={book.id}>
                  <TableCell className="px-4 text-xs text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell className="px-4 text-xs text-muted-foreground">{book.languages.map(l => l.language.name).join(", ") || "—"}</TableCell>
                  <TableCell className="px-4 text-xs text-muted-foreground">{book.categories.map(c => c.category.name).join(", ") || "—"}</TableCell>
                  <TableCell className="max-w-[180px] truncate px-4 font-medium">
                    <Link href={`/books/${book.slug}`} target="_blank" className="hover:text-primary">{book.name}</Link>
                  </TableCell>
                  <TableCell className="px-4 text-xs text-muted-foreground">
                    {book.authors.length > 0 ? book.authors.map(a => a.author.name).join(", ") : book.author}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge variant={statusVariant[book.approvalStatus?.name ?? ""] ?? "secondary"}>
                      {book.approvalStatus?.name ?? "—"}
                    </Badge>
                  </TableCell>
                  {isPending ? (
                    <BookApproveDeclineButtons
                      bookId={book.id}
                      currentStatus={book.approvalStatus?.name ?? ""}
                      variant="cells"
                    />
                  ) : (
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/books/admin/books/${book.id}/edit`} className="text-xs text-muted-foreground hover:underline">Edit</Link>
                        <BookApproveDeclineButtons
                          bookId={book.id}
                          currentStatus={book.approvalStatus?.name ?? ""}
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 && <Link href={buildUrl(page - 1)} className={linkClass}>← Prev</Link>}
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages && <Link href={buildUrl(page + 1)} className={linkClass}>Next →</Link>}
        </div>
      )}
    </div>
  )
}
