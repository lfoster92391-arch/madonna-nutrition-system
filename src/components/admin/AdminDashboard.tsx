"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  ADMIN_NAV_CATEGORIES,
  type AdminNavCategory,
} from "@/components/admin/layout/admin-nav-groups"
import { ADMIN_NAVY, ADMIN_SUCCESS } from "@/components/admin/layout/admin-theme"

export function AdminDashboard() {
  const { user } = useAuth()
  const adminName = user?.displayName?.split(" ")[0] ?? "Admin"
  const reactId = useId()
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeCategory: AdminNavCategory | null =
    ADMIN_NAV_CATEGORIES.find((c) => c.id === activeId) ?? null

  return (
    <div className="admin-page-pad">
      <div className="mx-auto w-full max-w-2xl space-y-6 sm:space-y-8">
        <header className="space-y-3">
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl" style={{ color: ADMIN_NAVY }}>
            Welcome back, {adminName}!
          </h1>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: `${ADMIN_SUCCESS}18`, color: ADMIN_SUCCESS }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ADMIN_SUCCESS }} />
            All systems operational
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            {activeCategory
              ? `Choose a ${activeCategory.label.toLowerCase()} tool below.`
              : "Pick a category, then open the page you need."}
          </p>
        </header>

        {activeCategory ? (
          <section aria-labelledby={`${reactId}-subnav-heading`} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
                style={{ color: ADMIN_NAVY }}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                All categories
              </button>
            </div>

            <h2
              id={`${reactId}-subnav-heading`}
              className="text-lg font-bold sm:text-xl"
              style={{ color: ADMIN_NAVY }}
            >
              {activeCategory.label}
            </h2>

            <div className="flex flex-col gap-3" role="list">
              {activeCategory.items.map((item, index) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  role="listitem"
                  className="landing-card-enter madonna-option-btn madonna-option-btn--rounded flex w-full min-h-14 items-center justify-center px-5 py-4 text-center sm:min-h-16 sm:px-6"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-base font-bold tracking-tight sm:text-lg">{item.label}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section aria-labelledby={`${reactId}-categories-heading`} className="space-y-4">
            <h2 id={`${reactId}-categories-heading`} className="sr-only">
              Admin categories
            </h2>
            <div className="flex flex-col gap-3" role="list">
              {ADMIN_NAV_CATEGORIES.map((category, index) => (
                <button
                  key={category.id}
                  type="button"
                  role="listitem"
                  onClick={() => setActiveId(category.id)}
                  className="landing-card-enter madonna-option-btn madonna-option-btn--rounded flex w-full min-h-14 items-center justify-between gap-3 px-5 py-4 text-left sm:min-h-16 sm:px-6"
                  style={{ animationDelay: `${index * 40}ms` }}
                  aria-expanded={false}
                >
                  <span className="text-base font-bold tracking-tight sm:text-lg">
                    {category.label}
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-white/85" aria-hidden />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
