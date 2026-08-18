"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  canSwitchParentAndWorkplace,
  workplaceHomePath,
  workplaceSwitchLabel,
} from "@/lib/auth/portal-roles"
import { cn } from "@/lib/utils"

const NAVY = "#001E62"

/**
 * Parent ↔ school portal switch for dual-role staff/admin/teachers who are also parents.
 */
export function PortalRoleSwitcher({ className }: { className?: string }) {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user || !canSwitchParentAndWorkplace(user)) return null

  const onParent = pathname.startsWith("/parent") || pathname.startsWith("/login/parent")
  const schoolHref = workplaceHomePath(user.role)
  const schoolLabel = workplaceSwitchLabel(user.role)

  const itemClass = (active: boolean) =>
    cn(
      "inline-flex min-h-9 items-center justify-center rounded-lg px-2.5 text-xs font-semibold sm:min-h-10 sm:px-3 sm:text-sm",
      active ? "text-white shadow-sm" : "transition hover:bg-[#001E62]/5"
    )

  return (
    <nav
      aria-label="Switch portal"
      className={cn(
        "inline-flex shrink-0 items-center rounded-xl border bg-white p-0.5",
        className
      )}
      style={{ borderColor: "#C8CDD7" }}
    >
      <Link
        href="/parent"
        className={itemClass(onParent)}
        style={onParent ? { backgroundColor: NAVY } : { color: NAVY }}
        aria-current={onParent ? "page" : undefined}
      >
        Parent
      </Link>
      <Link
        href={schoolHref}
        className={itemClass(!onParent)}
        style={!onParent ? { backgroundColor: NAVY } : { color: NAVY }}
        aria-current={!onParent ? "page" : undefined}
      >
        {schoolLabel}
      </Link>
    </nav>
  )
}
