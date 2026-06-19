"use client"

import { Suspense } from "react"
import { parentAnnouncements } from "@/data/demo"
import { PARENT_CARD, PARENT_NAVY, PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { Bell } from "lucide-react"

function ParentNotificationsContent() {
  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Notifications
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          School announcements and updates for your family.
        </p>
      </header>

      <section className={`${PARENT_CARD} divide-y divide-[#C8CDD7]`}>
        {parentAnnouncements.map((ann) => (
          <article key={ann.id} className="flex gap-4 p-5 md:p-6">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#041B52]/5"
              aria-hidden
            >
              <Bell className="h-5 w-5" style={{ color: PARENT_NAVY }} />
            </span>
            <div>
              <h2 className="font-semibold" style={{ color: PARENT_NAVY }}>
                {ann.title}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">{ann.body}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export function ParentNotificationsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <ParentNotificationsContent />
    </Suspense>
  )
}
