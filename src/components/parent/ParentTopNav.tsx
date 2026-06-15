"use client"

import Image from "next/image"
import Link from "next/link"
import { Bell, Settings, User } from "lucide-react"
import { PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"

export function ParentTopNav({ alertCount = 0 }: { alertCount?: number }) {
  return (
    <header
      className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center border-b border-[#C8CDD7] bg-white px-4 sm:h-[68px] sm:px-6 md:px-8"
      style={{ borderColor: "#C8CDD7" }}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <Link href="/parent" className="flex shrink-0 items-center">
          <Image
            src="/brand-logo.png"
            alt="Fuel The Dons"
            width={240}
            height={60}
            priority
            className="h-10 w-auto max-w-[180px] object-contain sm:max-w-[220px]"
          />
        </Link>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold sm:text-lg" style={{ color: PARENT_NAVY }}>
          Parent Dashboard
        </h1>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/parent/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-[10px] transition hover:bg-[#041B52]/5"
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
            href="/parent/settings"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] transition hover:bg-[#041B52]/5"
            aria-label="Profile"
          >
            <User className="h-5 w-5" style={{ color: PARENT_NAVY }} />
          </Link>
          <Link
            href="/parent/settings"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] transition hover:bg-[#041B52]/5"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" style={{ color: PARENT_NAVY }} />
          </Link>
        </div>
      </div>
    </header>
  )
}
