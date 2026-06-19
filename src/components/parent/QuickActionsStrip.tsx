"use client"

import Link from "next/link"
import {
  AlertTriangle,
  CreditCard,
  Heart,
  HelpCircle,
  History,
} from "lucide-react"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"

const actions = [
  { label: "Meal History", href: "/parent/meal-history", icon: History },
  { label: "Payments", href: "/parent/payments", icon: CreditCard },
  { label: "Food Preferences", href: "/parent/nutrition", icon: Heart },
  { label: "Alerts", href: "/parent/alerts", icon: AlertTriangle },
  { label: "Support", href: "/parent/help", icon: HelpCircle },
]

export function QuickActionsStrip() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
        Quick Actions
      </h2>
      <div className={`${PARENT_CARD} p-4 md:p-6`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center justify-center gap-2 rounded-[12px] px-3 py-4 transition hover:bg-[#041B52]/5"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#041B52]/5"
                aria-hidden
              >
                <Icon className="h-6 w-6" style={{ color: PARENT_NAVY }} />
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
