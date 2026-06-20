"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Bell,
  CreditCard,
  HelpCircle,
  History,
  Mail,
  School,
  Settings,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import {
  getAssetPilotEduUrl,
  getFactsFamilyLoginUrl,
  getParentGmailUrl,
  getParentNutritionEmail,
} from "@/config/parent-external-links"

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

const subtitleClass = "text-center text-[10px] leading-tight text-[#64748B] sm:text-xs"

type ExternalLinkTileProps = {
  href: string
  label: string
  subtitle?: string
  icon: ReactNode
}

function ExternalLinkTile({ href, label, subtitle, icon }: ExternalLinkTileProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={tileClass}
    >
      <span className={iconWrapClass} aria-hidden>
        {icon}
      </span>
      <span className={labelClass} style={{ color: PARENT_NAVY }}>
        {label}
      </span>
      {subtitle ? <span className={subtitleClass}>{subtitle}</span> : null}
    </a>
  )
}

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

        <div className="mt-6 border-t border-[#C8CDD7] pt-6">
          <h3 className="mb-4 text-sm font-bold md:text-base" style={{ color: PARENT_NAVY }}>
            Family Login Resources
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ExternalLinkTile
              href={getFactsFamilyLoginUrl()}
              label="FACTS Family Login"
              subtitle="School information system"
              icon={<School className="h-6 w-6" style={{ color: PARENT_NAVY }} />}
            />
            <ExternalLinkTile
              href={getAssetPilotEduUrl()}
              label="AssetPilot Edu"
              subtitle="Student asset management"
              icon={
                <Image
                  src="/assetpilot-logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-md object-contain"
                />
              }
            />
            <ExternalLinkTile
              href={getParentGmailUrl()}
              label="Open Gmail"
              subtitle={getParentNutritionEmail()}
              icon={<Mail className="h-6 w-6" style={{ color: PARENT_NAVY }} />}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
