"use client"

import Link from "next/link"
import { ArrowLeftRight, ClipboardCheck, History, ShieldAlert } from "lucide-react"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"

const actions = [
  { label: "Manage Allergies", href: "/parent/student-profile", icon: ShieldAlert },
  { label: "View Nutrition Forms", href: "/parent/agreement", icon: ClipboardCheck },
  { label: "Meal History", href: "/parent/meal-history", icon: History },
  { label: "Transfer Balance", href: "/parent/add-funds", icon: ArrowLeftRight },
]

export function StudentCenterQuickActions() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold" style={{ color: PARENT_NAVY }}>
        Quick Actions
      </h2>
      <div className={`${PARENT_CARD} p-4 md:p-6`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[14px] px-3 py-4 transition hover:bg-[#041B52]/5"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#041B52]/5"
                aria-hidden
              >
                <Icon className="h-5 w-5" style={{ color: PARENT_NAVY }} />
              </span>
              <span className="text-center text-xs font-semibold sm:text-sm" style={{ color: PARENT_NAVY }}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
