"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface Author { id: number; name: string }
interface Props {
  bookId: number
  currentStatus: string
  /**
   * "cells" renders three table cells the way the hymn list does, for the
   * pending view where the row is a queue of actions. "inline" renders one
   * group for the all-books view, where the status is the point and the
   * actions are secondary.
   */
  variant?: "cells" | "inline"
}

// Persists the last author selection across rows within the same page session,
// the way the hymn list persists singers — a batch of books being approved is
// usually a batch by one author.
let persistedAuthorIds: number[] = []

type ModalType = "accept" | "decline" | "new-author" | null

export default function BookApproveDeclineButtons({ bookId, currentStatus, variant = "inline" }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalType>(null)

  const [authors, setAuthors] = useState<Author[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [authorsLoading, setAuthorsLoading] = useState(false)
  const [authorsError, setAuthorsError] = useState("")

  const [newAuthorName, setNewAuthorName] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  function openModal(m: ModalType) {
    if (m === "accept") setSelectedIds([...persistedAuthorIds])
    setModal(m)
    setError("")
  }

  function closeModal() {
    setModal(null)
    setSelectedIds([])
    setSearch("")
    setNewAuthorName("")
    setError("")
  }

  useEffect(() => {
    if (modal !== "accept") return
    setTimeout(() => searchRef.current?.focus(), 50)
    if (authors.length > 0) return
    setAuthorsLoading(true)
    setAuthorsError("")
    fetch("/api/books/admin/authors")
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setAuthors)
      .catch(() => setAuthorsError("Failed to load authors. Please close and try again."))
      .finally(() => setAuthorsLoading(false))
  }, [modal, authors.length])

  useEffect(() => {
    if (modal === "new-author") setTimeout(() => nameRef.current?.focus(), 50)
  }, [modal])

  function toggleAuthor(id: number) {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      persistedAuthorIds = next
      return next
    })
  }

  async function handleAccept() {
    if (!selectedIds.length) { setError("Please select at least one author."); return }
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/books/admin/books/${bookId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorIds: selectedIds }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Failed to approve book."); return }
      closeModal(); router.refresh()
    } finally { setLoading(false) }
  }

  async function handleDecline() {
    setLoading(true)
    try {
      await fetch(`/api/books/admin/books/${bookId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      closeModal(); router.refresh()
    } finally { setLoading(false) }
  }

  async function handleAddAuthor() {
    if (!newAuthorName.trim()) { setError("Name is required."); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/books/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAuthorName.trim() }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Failed to add author."); return }
      const added: Author = await res.json()
      setAuthors(prev => [...prev, added].sort((a, b) => a.name.localeCompare(b.name)))
      closeModal()
    } finally { setLoading(false) }
  }

  const filtered = authors.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))

  function modalShell(title: string, body: React.ReactNode, footer: React.ReactNode) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20">
        <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
        <div className="relative w-full max-w-md rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="border-b px-5 py-4">
            <h4 className="text-base font-medium">{title}</h4>
          </div>
          <div className="px-5 py-4">{body}</div>
          <div className="flex items-center justify-end gap-2 border-t px-5 py-3">{footer}</div>
        </div>
      </div>,
      document.body
    )
  }

  const closeBtn = (
    <button type="button" onClick={closeModal}
      className="cursor-pointer rounded border border-input px-4 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
      Close
    </button>
  )

  const inputClass = "w-full rounded border border-input bg-background px-3 py-1.5 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
  const linkBtn = "cursor-pointer whitespace-nowrap text-xs hover:underline"

  return (
    <>
      {variant === "cells" ? (
        <>
          <td className="px-4 py-2.5">
            <button onClick={() => openModal("new-author")}
              className={`${linkBtn} text-muted-foreground hover:text-foreground`}>
              new author
            </button>
          </td>
          <td className="px-4 py-2.5">
            <button onClick={() => openModal("accept")} className={`${linkBtn} text-primary`}>
              accept
            </button>
          </td>
          <td className="px-4 py-2.5">
            <button onClick={() => openModal("decline")} className={`${linkBtn} text-destructive`}>
              decline
            </button>
          </td>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {currentStatus === "Accepted" && (
            <button onClick={() => openModal("decline")} className={`${linkBtn} text-destructive`}>
              decline
            </button>
          )}
          {currentStatus === "Declined" && (
            <button onClick={() => openModal("accept")} className={`${linkBtn} text-primary`}>
              accept
            </button>
          )}
          {currentStatus !== "Accepted" && currentStatus !== "Declined" && (
            <>
              <button onClick={() => openModal("accept")} className={`${linkBtn} text-primary`}>
                accept
              </button>
              <button onClick={() => openModal("decline")} className={`${linkBtn} text-destructive`}>
                decline
              </button>
            </>
          )}
        </div>
      )}

      {modal === "accept" && modalShell(
        "Accept book",
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Make sure you want to accept this book. Also please select the correct author(s)
            below — this will greatly help in searching books. You can add a new author by
            clicking the <em>new author</em> link if they are not in the list.
          </p>
          <label className="text-sm font-medium text-foreground">
            Author/s <span className="text-destructive">*</span>
          </label>
          {authorsLoading && (
            <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading authors…
            </div>
          )}
          {authorsError && <p className="py-2 text-sm text-destructive">{authorsError}</p>}
          {!authorsLoading && !authorsError && (
            <div className="mt-2">
              {selectedIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedIds.map(id => {
                    const name = authors.find(a => a.id === id)?.name
                    if (!name) return null
                    return (
                      <span key={id} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {name}
                        <button type="button" onClick={() => toggleAuthor(id)}
                          className="ml-0.5 cursor-pointer text-primary/60 hover:text-primary leading-none">
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search authors…"
                className={`${inputClass} mb-1`}
              />
              <div className="max-h-44 overflow-y-auto rounded border">
                {filtered.length === 0
                  ? <p className="px-3 py-2 text-sm text-muted-foreground">No results</p>
                  : filtered.map(a => (
                    <label key={a.id}
                      className="flex cursor-pointer select-none items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                      <input type="checkbox" checked={selectedIds.includes(a.id)}
                        onChange={() => toggleAuthor(a.id)} className="cursor-pointer" />
                      {a.name}
                    </label>
                  ))
                }
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </>,
        <>
          {closeBtn}
          <button type="button" onClick={handleAccept}
            disabled={loading || authorsLoading}
            className="flex cursor-pointer items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Accept
          </button>
        </>
      )}

      {modal === "decline" && modalShell(
        "Decline acceptance",
        <p className="py-3 text-sm text-muted-foreground">
          Are you sure you want to decline accepting this book?
        </p>,
        <>
          {closeBtn}
          <button type="button" onClick={handleDecline}
            disabled={loading}
            className="flex cursor-pointer items-center gap-1.5 rounded bg-destructive px-4 py-1.5 text-sm text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Decline
          </button>
        </>
      )}

      {modal === "new-author" && modalShell(
        "Add New Author",
        <>
          <label htmlFor={`author-name-${bookId}`} className="mb-1 block text-sm text-foreground">
            Author name
          </label>
          <input
            ref={nameRef}
            id={`author-name-${bookId}`}
            type="text"
            value={newAuthorName}
            onChange={e => setNewAuthorName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddAuthor()}
            placeholder="Name"
            className={inputClass}
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </>,
        <>
          {closeBtn}
          <button type="button" onClick={handleAddAuthor}
            disabled={loading}
            style={{ minWidth: 80 }}
            className="flex cursor-pointer items-center gap-1.5 rounded bg-primary px-5 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add
          </button>
        </>
      )}
    </>
  )
}
