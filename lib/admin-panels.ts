import type { Session } from "next-auth"
import {
  hasBookAdminAccess, hasHymnAdminAccess, hasLiturgyAdminAccess,
  hasMainAdminAccess, hasQuizAdminAccess, hasSermonAdminAccess,
} from "@/lib/auth-helpers"

// The admin panels, in the order the public nav lists their sections.
//
// Each panel's layout already guards itself; this list only decides what to
// offer, so someone who runs two of them can cross between without going out
// through the public site and back in.
export interface AdminPanel {
  key: string
  title: string
  href: string
  /** Key into AdminShell's ICONS. */
  icon: string
  canAccess: (session: Session | null) => boolean
}

export const ADMIN_PANELS: AdminPanel[] = [
  { key: "main",    title: "Main admin",    href: "/admin",         icon: "users",      canAccess: hasMainAdminAccess },
  { key: "liturgy", title: "Liturgy admin", href: "/liturgy/admin", icon: "bookOpen",   canAccess: hasLiturgyAdminAccess },
  { key: "hymns",   title: "Hymn admin",    href: "/hymns/admin",   icon: "music",      canAccess: hasHymnAdminAccess },
  { key: "sermons", title: "Sermon admin",  href: "/sermons/admin", icon: "mic",        canAccess: hasSermonAdminAccess },
  { key: "books",   title: "Book admin",    href: "/books/admin",   icon: "bookMarked", canAccess: hasBookAdminAccess },
  { key: "quiz",    title: "Quiz admin",    href: "/quiz/admin",    icon: "helpCircle", canAccess: hasQuizAdminAccess },
]

export function accessiblePanels(session: Session | null): AdminPanel[] {
  return ADMIN_PANELS.filter(p => p.canAccess(session))
}
