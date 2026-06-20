"use client"

import Link from "next/link"
import {
  Bell,
  CreditCard,
  HelpCircle,
  History,
  Settings,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"

type QuickActionsStripProps = {
  onAddFunds?: () => void
  onHistory?: () => void
  onMealActivity?: () => void
  onAlerts?: () => void
  onSettings?: () => void
  onStudents?: () => void
}

const tileClass =
  "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-[12px] px-3 py-4 transition hover:bg-[#041B52]/5 active:bg-[#041B52]/10"

const iconWrapClass =
  "flex h-14 w-14 items-center justify-center rounded-full bg-[#041B52]/5"

const labelClass = "text-center text-xs font-semibold sm:text-sm"

export function QuickActionsStrip({
  onAddFunds,
  onHistory,
  onMealActivity,
  onAlerts,
  onSettings,
  onStudents,
}: QuickActionsStripProps) {
  const openMealActivity = onMealActivity ?? onHistory

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
        Quick Actions
      </h2>
      <div className={`${PARENT_CARD} p-4 md:p-6`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          <Link href="/parent/payments" className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <CreditCard className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              Payments
            </span>
          </Link>

          <button type="button" onClick={onHistory} className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <History className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              History
            </span>
          </button>

          <button type="button" onClick={onSettings} className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <Settings className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              Settings
            </span>
          </button>

          <Link href="/parent/help" className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <HelpCircle className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              Support
            </span>
          </Link>

          <button type="button" onClick={onStudents} className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <Users className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              Students
            </span>
          </button>

          <button type="button" onClick={onAddFunds} className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <Wallet className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              Add Funds
            </span>
          </button>

          <button type="button" onClick={openMealActivity} className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <UtensilsCrossed className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              Meal Activity
            </span>
          </button>

          <button type="button" onClick={onAlerts} className={tileClass}>
            <span className={iconWrapClass} aria-hidden>
              <Bell className="h-6 w-6" style={{ color: PARENT_NAVY }} />
            </span>
            <span className={labelClass} style={{ color: PARENT_NAVY }}>
              Alerts
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
