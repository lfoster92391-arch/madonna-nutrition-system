"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, LogOut, UtensilsCrossed } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { madonnaOptionBtn } from "@/components/nav/madonna-option-classes"
import { signOutAndRedirect } from "@/lib/auth/logout"
import { BRAND } from "@/config/brand"
import { cn } from "@/lib/utils"

export function StudentPortalShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const isHome = pathname === "/student"
  const orderActive = pathname.startsWith("/student/order")
  const ordersActive = pathname.startsWith("/student/orders")
  const guideActive = pathname.startsWith("/student/guide")

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FB]">
      <header className="sticky top-0 z-20 border-b border-[#C8CDD7] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-[#64748B]">
              {BRAND.productName}
            </p>
            <p className="truncate text-base font-bold text-[#041B52]">Student lunch</p>
          </div>
          <button
            type="button"
            className={cn(
              madonnaOptionBtn({ shape: "rounded" }),
              "inline-flex min-h-10 items-center gap-2 px-3 text-sm font-bold"
            )}
            onClick={() => signOutAndRedirect("student", logout)}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
        {!isHome ? (
          <div className="border-t border-[#E2E8F0] bg-white px-4 py-2 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/student"
                className="inline-flex min-h-10 items-center text-sm font-semibold text-[#041B52] hover:underline"
              >
                ← Back to student home
              </Link>
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <nav className="sticky bottom-0 border-t border-[#C8CDD7] bg-white" aria-label="Student">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-2 sm:px-6">
          <Link
            href="/student/order"
            className={cn(
              madonnaOptionBtn({ active: orderActive, shape: "rounded" }),
              "flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-bold"
            )}
          >
            <UtensilsCrossed className="h-4 w-4" aria-hidden />
            Order lunch
          </Link>
          <Link
            href="/student/orders"
            className={cn(
              madonnaOptionBtn({ active: ordersActive, shape: "rounded" }),
              "flex flex-1 items-center justify-center px-3 py-3 text-sm font-bold"
            )}
          >
            My orders
          </Link>
          <Link
            href="/student/guide"
            className={cn(
              madonnaOptionBtn({ active: guideActive, shape: "rounded" }),
              "flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm font-bold"
            )}
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            Guide
          </Link>
        </div>
        {user ? (
          <p className="pb-2 text-center text-xs text-[#64748B]">
            Signed in as {user.displayName}
          </p>
        ) : null}
      </nav>
    </div>
  )
}
