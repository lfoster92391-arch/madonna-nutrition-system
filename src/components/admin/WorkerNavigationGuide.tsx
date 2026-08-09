"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Camera,
  ChefHat,
  DollarSign,
  IdCard,
  ScanLine,
  Upload,
  Users,
  UtensilsCrossed,
} from "lucide-react"
import {
  ADMIN_BG,
  ADMIN_NAVY,
  ADMIN_SILVER,
  ADMIN_WHITE,
} from "@/components/admin/layout/admin-theme"
import { AdminSecurityNote } from "@/components/admin/AdminSecurityNote"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

interface GuideStep {
  number: number
  title: string
  plain: string
  details: string[]
  href: string
  buttonLabel: string
  icon: LucideIcon
}

const GUIDE_STEPS: GuideStep[] = [
  {
    number: 1,
    title: "Menu vs Cookbook",
    plain: "Two different places for food.",
    details: [
      "Cookbook = your saved meals and recipes (reuse anytime).",
      "Menu / Calendar = what students eat on which day.",
      "Build meals in Cookbook first, then put them on the calendar.",
      "Photos & Items: upload a stock photo, then Replace · Take photo when the real meal is ready.",
    ],
    href: "/admin/cookbook",
    buttonLabel: "Open Cookbook",
    icon: ChefHat,
  },
  {
    number: 2,
    title: "Build the weekly menu",
    plain: "Pick what is served each day.",
    details: [
      "Use Menu Builder for weekly templates.",
      "Use Calendar to schedule and publish service dates.",
      "Parents and the lunch line see published days only.",
    ],
    href: "/admin/calendar",
    buttonLabel: "Open Calendar",
    icon: UtensilsCrossed,
  },
  {
    number: 3,
    title: "Students & imports",
    plain: "Add students, then open each profile.",
    details: [
      "Import from a spreadsheet, or add one student at a time.",
      "After a student is added, tap Open profile.",
      "Use Take photo or Upload photo, then Save — the photo goes on their badge.",
    ],
    href: "/admin/imports",
    buttonLabel: "Open Students",
    icon: Upload,
  },
  {
    number: 4,
    title: "Photos for badges",
    plain: "Upload a picture or take one with a phone.",
    details: [
      "Students list → Open profile.",
      "Tap Take photo (phone camera) or Upload photo, then Save.",
      "You should see “Photo saved for badges.” Badge Manager and the lunch line use this same photo.",
    ],
    href: "/admin/imports",
    buttonLabel: "Add Student Photos",
    icon: Camera,
  },
  {
    number: 5,
    title: "Badges & lunch line",
    plain: "Scan badges to charge meals.",
    details: [
      "Badge Setup shows each student’s photo from their profile.",
      "Open Cashier / Scan on a tablet at the lunch line.",
      "Scan the badge → confirm meal → balance updates.",
    ],
    href: "/scan",
    buttonLabel: "Open Lunch Line",
    icon: ScanLine,
  },
  {
    number: 6,
    title: "Add money to a lunch account",
    plain: "Student pays cash/check in the office? Enter it here.",
    details: [
      "Find the student → Open profile or Add money to account.",
      "Enter the amount and how they paid (cash, check, or card).",
      "The money is added to their lunch account right away.",
      "Online parent card payments use Stripe — we never store card numbers.",
    ],
    href: "/admin/imports",
    buttonLabel: "Go to Students",
    icon: DollarSign,
  },
  {
    number: 7,
    title: "Staff & teacher badges (setup)",
    plain: "Create accounts, add photos, and print lunch badges.",
    details: [
      "Open Staff Accounts to import or add cafeteria staff and teachers.",
      "Tap Open profile → Take photo or Upload photo → Save photo (same as students).",
      "Set a 4–6 digit Badge ID, then print from Staff directory or Badge Setup → Staff & teacher badges.",
      "Staff can scan their badge at the lunch line when they have a lunch balance.",
    ],
    href: "/admin/imports?tab=staff",
    buttonLabel: "Manage Staff Accounts",
    icon: Users,
  },
]

const QUICK_LINKS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Cookbook", href: "/admin/cookbook", icon: BookOpen },
  { label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Students", href: "/admin/imports", icon: Upload },
  { label: "Badges", href: "/admin/badges", icon: IdCard },
  { label: "Lunch Line", href: "/scan", icon: ScanLine },
]

export function WorkerNavigationGuide() {
  return (
    <div className="space-y-5 sm:space-y-8">
      <div className="space-y-2 sm:space-y-3">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: ADMIN_SILVER }}
        >
          Fuel The Dons
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl" style={{ color: ADMIN_NAVY }}>
          How to use this site
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed sm:text-base md:text-lg" style={{ color: ADMIN_SILVER }}>
          New to computers? That is okay. Follow the big buttons below, one step at a time.
          You do not need to memorize everything — come back here anytime.
        </p>
      </div>

      <AdminSecurityNote />

      <div className="mobile-scroll-x flex gap-2 pb-1 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0">
        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
          <Button
            key={label}
            asChild
            size="lg"
            className="min-h-12 min-w-[7.5rem] shrink-0 text-sm font-semibold sm:min-h-14 sm:min-w-[9rem] sm:text-base"
            style={{ backgroundColor: ADMIN_NAVY }}
          >
            <Link href={href}>
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="space-y-4 sm:space-y-5">
        {GUIDE_STEPS.map((step) => {
          const Icon = step.icon
          const isAnchor = step.href.startsWith("#")
          return (
            <Card
              key={step.number}
              className="overflow-hidden border shadow-sm"
              style={{ borderColor: ADMIN_SILVER, backgroundColor: ADMIN_WHITE }}
            >
              <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5 md:flex-row md:items-start md:p-6">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white sm:h-14 sm:w-14 sm:text-xl"
                  style={{ backgroundColor: ADMIN_NAVY }}
                  aria-hidden
                >
                  {step.number}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: ADMIN_BG }}
                    >
                      <Icon className="h-5 w-5" style={{ color: ADMIN_NAVY }} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold sm:text-xl" style={{ color: ADMIN_NAVY }}>
                        {step.title}
                      </h2>
                      <p className="text-sm sm:text-base" style={{ color: ADMIN_SILVER }}>
                        {step.plain}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm leading-relaxed md:text-base" style={{ color: ADMIN_NAVY }}>
                    {step.details.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ADMIN_NAVY }} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    size="lg"
                    className="mt-2 min-h-12 w-full text-base font-semibold sm:w-auto"
                    style={{ backgroundColor: ADMIN_NAVY }}
                  >
                    {isAnchor ? (
                      <a href={step.href}>{step.buttonLabel}</a>
                    ) : (
                      <Link href={step.href}>{step.buttonLabel}</Link>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card id="staff-accounts" className="scroll-mt-24 border" style={{ borderColor: ADMIN_SILVER }}>
        <CardHeader>
          <CardTitle className="text-xl" style={{ color: ADMIN_NAVY }}>
            Staff accounts (still needed for setup)
          </CardTitle>
          <p className="text-sm leading-relaxed" style={{ color: ADMIN_SILVER }}>
            Create logins for cafeteria workers below. Most day-to-day work happens in the
            steps above — this section is only for who can sign in.
          </p>
        </CardHeader>
      </Card>
    </div>
  )
}
