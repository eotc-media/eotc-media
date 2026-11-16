"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { accessiblePanels } from "@/lib/admin-panels"
import {
  LayoutDashboard, Music, Mic, FileText, Globe, Tag, Layers, CheckSquare,
  MessageSquare, MessageCircle, BookMarked, BookOpen, User, Users, HelpCircle, Award,
  BookType, Star, Home, Mail, Menu, X, Search, ChevronRight, ChevronsUpDown,
  PanelLeft, ArrowUpRight, LogOut, type LucideIcon,
} from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, music: Music, mic: Mic, fileText: FileText,
  globe: Globe, tag: Tag, layers: Layers, checkSquare: CheckSquare,
  messageSquare: MessageSquare, messageCircle: MessageCircle,
  bookMarked: BookMarked, bookOpen: BookOpen,
  user: User, users: Users, helpCircle: HelpCircle, award: Award,
  bookType: BookType, star: Star, home: Home, mail: Mail, search: Search,
}

export interface AdminNavItem {
  title: string
  href: string
  icon: string
  /** Active only when pathname equals href exactly (e.g. dashboard). */
  exact?: boolean
  /** "pending": active when ?status=pending. "none": active when not pending. */
  status?: "pending" | "none"
}

interface AdminShellProps {
  brandTitle: string
  brandSubtitle: string
  brandIcon: string
  nav: AdminNavItem[]
  backHref: string
  backLabel: string
  children: React.ReactNode
}

// Whether the sidebar is collapsed, remembered on this device.
const SIDEBAR_KEY = "admin_sidebar"
function readSidebar() {
  try { return localStorage.getItem(SIDEBAR_KEY) === "collapsed" } catch { return false }
}
function subscribeSidebar(onChange: () => void) {
  window.addEventListener(SIDEBAR_KEY, onChange)
  window.addEventListener("storage", onChange)
  return () => { window.removeEventListener(SIDEBAR_KEY, onChange); window.removeEventListener("storage", onChange) }
}

function initials(name?: string | null) {
  if (!name) return "U"
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function AdminShell({
  brandTitle, brandSubtitle, brandIcon, nav, backHref, backLabel, children,
}: AdminShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebar, () => false)
  const [panelsOpen, setPanelsOpen] = useState(false)
  const panelsRef = useRef<HTMLDivElement>(null)

  const user = session?.user
  const userName = user?.name || "User"
  const BrandIcon = ICONS[brandIcon] ?? LayoutDashboard

  // Only the panels this admin can actually open. Someone who runs one module
  // sees no switcher at all, and the brand stays a plain link out to the site.
  // Which panel we are in comes from the path rather than the brand text, so a
  // renamed heading cannot make a panel list itself.
  const panels = accessiblePanels(session ?? null)
  const otherPanels = panels.filter(
    p => pathname !== p.href && !pathname.startsWith(p.href + "/")
  )
  const canSwitch = otherPanels.length > 0

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelsRef.current && !panelsRef.current.contains(e.target as Node)) setPanelsOpen(false)
    }
    if (panelsOpen) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [panelsOpen])

  function isActive(item: AdminNavItem) {
    const base = item.href.split("?")[0]
    if (item.exact) return pathname === base
    if (item.status === "pending") return pathname === base && searchParams.get("status") === "pending"
    if (item.status === "none") return (pathname === base && searchParams.get("status") !== "pending") || pathname.startsWith(base + "/")
    return pathname === base || pathname.startsWith(base + "/")
  }

  function toggleCollapsed() {
    try { localStorage.setItem(SIDEBAR_KEY, collapsed ? "open" : "collapsed") } catch {}
    window.dispatchEvent(new Event(SIDEBAR_KEY))
  }

  // The user menu at the foot of the sidebar.
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!userOpen) return
    const close = (e: MouseEvent) => { if (!userRef.current?.contains(e.target as Node)) setUserOpen(false) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [userOpen])

  // Breadcrumbs: the panel, the section, and "New"/"Edit" below it.
  const current = nav.find(isActive)
  const crumbs: { label: string; href?: string }[] = [{ label: brandTitle, href: nav[0]?.href }]
  if (current && current !== nav[0]) crumbs.push({ label: current.title, href: current.href })
  const last = pathname.split("/").filter(Boolean).pop()
  if (current && pathname !== current.href.split("?")[0]) {
    if (last === "new") crumbs.push({ label: "New" })
    else if (last === "edit") crumbs.push({ label: "Edit" })
  }

  const navLink = (item: AdminNavItem) => {
    const Icon = ICONS[item.icon] ?? LayoutDashboard
    const active = isActive(item)
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        title={collapsed ? item.title : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
          active
            ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.title}</span>}
      </Link>
    )
  }

  const brandTile = (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <BrandIcon className="h-4 w-4" />
    </div>
  )

  return (
    <div className="admin-theme min-h-screen bg-background text-foreground">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[3.5rem]" : "w-64"
        )}
      >
        {/* The panel, with a switcher when this admin runs more than one */}
        <div className="relative flex h-14 items-center gap-2 border-b border-sidebar-border px-2.5" ref={panelsRef}>
          {canSwitch ? (
            <button
              onClick={() => setPanelsOpen(v => !v)}
              title={collapsed ? "Switch panel" : undefined}
              aria-haspopup="menu"
              aria-expanded={panelsOpen}
              className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1 text-left transition-colors hover:bg-sidebar-accent cursor-pointer", collapsed && "justify-center")}
            >
              {brandTile}
              {!collapsed && (
                <>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">{brandTitle}</span>
                    <span className="truncate text-xs text-sidebar-foreground/55">{brandSubtitle}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto h-4 w-4 flex-shrink-0 text-sidebar-foreground/45" />
                </>
              )}
            </button>
          ) : (
            <Link href={backHref} className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1", collapsed && "justify-center")}>
              {brandTile}
              {!collapsed && (
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">{brandTitle}</span>
                  <span className="truncate text-xs text-sidebar-foreground/55">{brandSubtitle}</span>
                </div>
              )}
            </Link>
          )}

          <button className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>

          {panelsOpen && (
            <div role="menu" className="absolute left-2 right-2 top-full z-50 mt-1 overflow-hidden rounded-lg bg-popover py-1 shadow-lg ring-1 ring-foreground/10">
              <p className="px-3 py-1.5 text-xs text-muted-foreground">Switch panel</p>
              {otherPanels.map(p => {
                const Icon = ICONS[p.icon] ?? LayoutDashboard
                return (
                  <Link
                    key={p.key}
                    href={p.href}
                    role="menuitem"
                    onClick={() => { setPanelsOpen(false); setSidebarOpen(false) }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate">{p.title}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Sections */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {nav.map(navLink)}
        </nav>

        {/* Back to the public pages */}
        <div className="border-t border-sidebar-border p-2">
          <Link
            href={backHref}
            title={collapsed ? backLabel : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{backLabel}</span>}
          </Link>
        </div>

        {/* Who is signed in, with a menu */}
        <div className="relative border-t border-sidebar-border p-2" ref={userRef}>
          <button
            onClick={() => setUserOpen(o => !o)}
            className={cn("flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-accent cursor-pointer", collapsed && "justify-center")}
          >
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarImage src={user?.image ? `/api/main/profile/pictures/${user.image}` : undefined} alt={userName} />
              <AvatarFallback className="rounded-md bg-sidebar-primary text-xs text-sidebar-primary-foreground">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">{userName}</p>
                  <p className="truncate text-xs text-sidebar-foreground/55">{user?.email}</p>
                </div>
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0 text-sidebar-foreground/45" />
              </>
            )}
          </button>
          {userOpen && (
            <div className="absolute bottom-full left-2 z-50 mb-1 w-56 overflow-hidden rounded-lg bg-popover py-1 shadow-lg ring-1 ring-foreground/10">
              <Link href="/" className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted"><Home className="h-4 w-4 text-muted-foreground" /> EOTC Media home</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted cursor-pointer">
                <LogOut className="h-4 w-4 text-muted-foreground" /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[3.5rem]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center gap-2 border-b bg-card px-4">
          <button className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>
          <button className="-ml-1 hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:block cursor-pointer" onClick={toggleCollapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label="Toggle sidebar">
            <PanelLeft className="h-4 w-4" />
          </button>
          <Separator orientation="vertical" className="mr-1 h-4" />
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((c, i) => (
              <span key={i} className={cn("flex min-w-0 items-center gap-1.5", i < crumbs.length - 1 && "hidden md:flex")}>
                {i > 0 && <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60", i === crumbs.length - 1 && "hidden md:block")} />}
                {c.href && i < crumbs.length - 1 ? (
                  <Link href={c.href} className="max-w-60 truncate text-muted-foreground hover:text-foreground">{c.label}</Link>
                ) : (
                  <span className="max-w-60 truncate font-medium text-foreground">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <Link href={backHref} className="ml-auto hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex">
            {backLabel} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
