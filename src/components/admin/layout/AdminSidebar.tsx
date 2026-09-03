"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  User,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { SCHOOL } from "@/config/school"
import { signOutAndRedirect } from "@/lib/auth/logout"
import { cn } from "@/lib/utils"
import { useAdminLayout } from "@/components/admin/layout/admin-layout-context"
import { ADMIN_NAV_CATEGORIES } from "@/components/admin/layout/admin-nav-groups"
import {
  ADMIN_SIDEBAR_DARK,
  ADMIN_SIDEBAR_STORAGE_KEY,
} from "@/components/admin/layout/admin-theme"
import { useOverlayLock } from "@/hooks/useOverlayLock"

function hrefPath(href: string) {
  return href.split("?")[0]
}

function itemIsActive(pathname: string, href: string) {
  const pathPart = hrefPath(href)
  return pathname === pathPart || pathname.startsWith(`${pathPart}/`)
}

function categoryContainsActive(pathname: string, items: { href: string }[]) {
  return items.some((item) => itemIsActive(pathname, item.href))
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const adminName = user?.displayName ?? "Admin User"
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAdminLayout()
  const [expanded, setExpanded] = useState(true)
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)

  const closeMobile = useCallback(() => setMobileSidebarOpen(false), [setMobileSidebarOpen])

  useOverlayLock(mobileSidebarOpen, closeMobile)

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY)
    if (stored !== null) setExpanded(stored === "true")
  }, [])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname, setMobileSidebarOpen])

  useEffect(() => {
    const match = ADMIN_NAV_CATEGORIES.find((c) =>
      categoryContainsActive(pathname, c.items)
    )
    if (match) setOpenCategoryId(match.id)
  }, [pathname])

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  const expandSidebar = () => {
    setExpanded(true)
    localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, "true")
  }

  const dashboardActive = pathname === "/admin"

  return (
    <>
      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(16.5rem,88vw)] flex-col text-white transition-[transform,width] duration-200 md:relative md:z-20 md:w-60 md:shrink-0 md:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          expanded ? "md:w-60" : "md:w-[72px]"
        )}
        style={{ backgroundColor: ADMIN_SIDEBAR_DARK }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-3 md:hidden">
          <p className="truncate text-sm font-semibold text-white">Menu</p>
          <button
            type="button"
            onClick={closeMobile}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4" aria-label="Admin">
          <Link
            href="/admin"
            title={!expanded ? "Dashboard" : undefined}
            onClick={closeMobile}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
              dashboardActive
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className={cn("truncate", !expanded && "md:hidden")}>Dashboard</span>
          </Link>

          {ADMIN_NAV_CATEGORIES.map((category) => {
            const isOpen = openCategoryId === category.id
            const hasActive = categoryContainsActive(pathname, category.items)
            const panelId = `admin-nav-${category.id}`

            return (
              <div key={category.id} className="pt-0.5">
                <button
                  type="button"
                  title={category.label}
                  aria-expanded={expanded ? isOpen : undefined}
                  aria-controls={expanded ? panelId : undefined}
                  onClick={() => {
                    if (!expanded) {
                      expandSidebar()
                      setOpenCategoryId(category.id)
                      return
                    }
                    setOpenCategoryId(isOpen ? null : category.id)
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium transition",
                    hasActive || isOpen
                      ? "bg-white/12 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-[10px] font-bold uppercase tracking-wide",
                      expanded ? "hidden" : "hidden md:flex"
                    )}
                    aria-hidden
                  >
                    {category.label.slice(0, 2)}
                  </span>
                  <span className={cn("flex-1 truncate text-left", !expanded && "md:hidden")}>
                    {category.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-white/70 transition-transform",
                      !expanded && "md:hidden",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>

                {isOpen && expanded ? (
                  <div
                    id={panelId}
                    className="mt-0.5 ml-3 space-y-0.5 border-l border-white/15 pl-2"
                  >
                    {category.items.map((item) => {
                      const active = itemIsActive(pathname, item.href)
                      return (
                        <Link
                          key={`${category.id}-${item.label}`}
                          href={item.href}
                          onClick={closeMobile}
                          className={cn(
                            "flex min-h-10 items-center rounded-md px-2.5 text-[13px] font-medium transition",
                            active
                              ? "bg-white/15 text-white"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={cn("space-y-3", !expanded && "md:hidden")}>
            <div>
              <p className="text-xs font-semibold text-white">{SCHOOL.name}</p>
              <p className="mt-0.5 text-[11px] text-white/60">{SCHOOL.location}</p>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <User className="h-4 w-4 text-white" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{adminName}</p>
                <p className="truncate text-[11px] text-white/60">System Administrator</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOutAndRedirect("admin", logout)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Sign out
            </button>

            <button
              type="button"
              onClick={toggle}
              className="hidden w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white md:flex"
              aria-label="Collapse menu"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Collapse Menu
            </button>
          </div>

          {expanded ? null : (
            <div className="hidden space-y-2 md:block">
              <button
                type="button"
                title="Sign out"
                onClick={() => signOutAndRedirect("admin", logout)}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggle}
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15"
                aria-label="Expand menu"
                title="Expand menu"
              >
                <ChevronLeft className="h-4 w-4 rotate-180 text-white" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
