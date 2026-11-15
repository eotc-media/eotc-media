"use client"

import Link from "@/components/NoPrefetchLink"
import { usePathname } from "next/navigation"
import { Heart, MessageSquare, Plus, Tv, User } from "lucide-react"
import { useTr } from "@/components/home/shared"

/** The Sermons section's own navigation: a row of tabs under the site bar,
 *  the same on every Sermons page (it used to be a left sidebar). */
export default function SermonSidebar({ userId }: { userId?: number }) {
  const pathname = usePathname()
  const { tr } = useTr()

  const tabs = [
    { href: "/sermons", label: tr("ስብከቶች", "Sermons"), icon: MessageSquare, active: pathname === "/sermons" },
    { href: "/sermons/channels", label: tr("ቻናሎች", "Channels"), icon: Tv, active: pathname.startsWith("/sermons/channels") },
    { href: userId ? "/sermons/favorites" : "/auth/login", label: tr("የወደድኳቸው", "Favorites"), icon: Heart, active: pathname === "/sermons/favorites" },
    { href: userId ? "/sermons/my-sermons" : "/auth/login", label: tr("ያስገባኋቸው", "My sermons"), icon: User, active: pathname.startsWith("/sermons/my-sermons") },
  ]

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 sm:px-6 lg:px-10">
        <ul className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none]">
          {tabs.map(t => (
            <li key={t.href + t.label} className="flex-shrink-0">
              <Link
                href={t.href}
                className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  t.active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={userId ? "/sermons/submit" : "/auth/login"}
          className={`ml-2 hidden flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold sm:inline-flex ${
            pathname === "/sermons/submit" ? "bg-blue-50 text-blue-700" : "text-blue-600 hover:bg-blue-50"
          }`}
        >
          <Plus className="h-4 w-4" /> {tr("ስብከት ያስገቡ", "Add a sermon")}
        </Link>
      </div>
    </nav>
  )
}
