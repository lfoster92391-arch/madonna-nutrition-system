"use client"

import Link from "next/link"
import { Megaphone } from "lucide-react"
import { useParentAnnouncements } from "@/hooks/useParentAnnouncements"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"

export function ParentMobileAnnouncements() {
  const announcements = useParentAnnouncements()
  const latest = announcements[0]

  if (!latest) return null

  return (
    <section className={`${PARENT_CARD} p-4 md:hidden`}>
      <div className="flex items-start gap-3">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: PARENT_NAVY }} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
            School announcement
          </p>
          <p className="mt-1 font-semibold" style={{ color: PARENT_NAVY }}>
            {latest.title}
          </p>
          <p className="mt-1 text-sm text-[#64748B]">{latest.body}</p>
          {announcements.length > 1 ? (
            <Link
              href="/parent/notifications"
              className="mt-2 inline-block text-sm font-medium"
              style={{ color: PARENT_NAVY }}
            >
              View all announcements
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
