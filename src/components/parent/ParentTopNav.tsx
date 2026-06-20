"use client"

import Link from "next/link"
import { Bell, Settings, User } from "lucide-react"
import { PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"

type ParentTopNavProps = {
  alertCount?: number
  title?: string
}

export function ParentTopNav({ alertCount = 0, title = "Parent Dashboard" }: ParentTopNavProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center border-b border-[#C8CDD7] bg-white px-4 sm:h-[68px] sm:px-6 md:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="hidden w-[180px] shrink-0 md:block" aria-hidden />

        <h1
          className="min-w-0 flex-1 truncate text-center text-sm font-semibold sm:text-base md:text-lg"
          style={{ color: PARENT_NAVY }}
        >
          {title}
        </h1>

        <div className="flex w-[180px] shrink-0 items-center justify-end gap-0.5 sm:gap-1">
          <Link
            href="/parent/notifications"
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-[10px] transition hover:bg-[#041B52]/5"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" style={{ color: PARENT_NAVY }} />
            {alertCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </Link>
          <Link
            href="/parent/settings?section=profile"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] transition hover:bg-[#041B52]/5"
            aria-label="Profile"
          >
            <User className="h-5 w-5" style={{ color: PARENT_NAVY }} />
          </Link>
          <Link
            href="/parent/settings"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-[10px] transition hover:bg-[#041B52]/5"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" style={{ color: PARENT_NAVY }} />
          </Link>
        </div>
      </div>
    </header>
  )
}
