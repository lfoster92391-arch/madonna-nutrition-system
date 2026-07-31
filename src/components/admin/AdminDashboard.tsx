"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Brain,
  Calendar,
  ChefHat,
  ClipboardList,
  DollarSign,
  IdCard,
  Megaphone,
  Package,
  PackageCheck,
  Palette,
  Receipt,
  Truck,
  Upload,
  UtensilsCrossed,
  Wand2,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  ADMIN_BG,
  ADMIN_DANGER,
  ADMIN_NAVY,
  ADMIN_SILVER,
  ADMIN_SUCCESS,
  ADMIN_WARNING,
  ADMIN_WHITE,
} from "@/components/admin/layout/admin-theme"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import type { ImportExportType } from "@/lib/import-export"

interface LauncherCard {
  title: string
  description: string
  href: string
  icon: LucideIcon
  statusLabel?: string
  statusColor?: "success" | "warning" | "danger" | "neutral"
  openTasks?: number
  importExportType?: ImportExportType
}

interface LauncherSection {
  number: number
  id: string
  title: string
  hint?: string
  cards: LauncherCard[]
}

const DAILY_ACTIONS: LauncherCard[] = [
  {
    title: "Open today's menu",
    description:
      "See and change what is being served. Pick a day, then add meals from your cookbook.",
    href: "/admin/calendar",
    icon: UtensilsCrossed,
  },
  {
    title: "Open cookbook",
    description:
      "Your saved meals with photos and prices. Create meals here, then put them on the menu.",
    href: "/admin/cookbook",
    icon: ChefHat,
  },
  {
    title: "Import students",
    description:
      "Pick a spreadsheet file, check the rows, then import. Also used for parent accounts.",
    href: "/admin/imports",
    icon: Upload,
    importExportType: "students",
  },
  {
    title: "Student badges",
    description: "Set up scan badges and ID photos for the lunch line.",
    href: "/admin/badges",
    icon: IdCard,
    importExportType: "badges",
  },
]

const SECTIONS: LauncherSection[] = [
  {
    number: 1,
    id: "get-started",
    title: "First-time setup",
    hint: "Do these once when you are getting the system ready.",
    cards: [
      {
        title: "Setup checklist",
        description: "Users, roles, and who can sign in.",
        href: "/admin/setup",
        icon: Wand2,
      },
      {
        title: "Meal prices",
        description: "Set lunch prices and account rules.",
        href: "/admin/pricing",
        icon: BadgeDollarSign,
      },
    ],
  },
  {
    number: 2,
    id: "menu",
    title: "Menus",
    hint: "Cookbook = saved meals. Menu = what is served each day.",
    cards: [
      {
        title: "Cookbook",
        description: "Save reusable meals with photos — then add them to any day.",
        href: "/admin/cookbook",
        icon: ChefHat,
        importExportType: "menu",
      },
      {
        title: "Lunch menu",
        description: "Choose a day and put meals on the calendar for students and parents.",
        href: "/admin/calendar",
        icon: Calendar,
      },
      {
        title: "Printable menus",
        description: "Design menu boards and signs to print.",
        href: "/admin/calendar/design",
        icon: Palette,
      },
    ],
  },
  {
    number: 3,
    id: "operations",
    title: "Kitchen & ordering",
    cards: [
      {
        title: "Receiving",
        description: "Log deliveries when food arrives.",
        href: "/admin/receiving",
        icon: PackageCheck,
        openTasks: 2,
      },
      {
        title: "Inventory",
        description: "Track what you have in stock.",
        href: "/admin/inventory",
        icon: Package,
        openTasks: 3,
        importExportType: "inventory",
      },
      {
        title: "Kitchen prep",
        description: "Daily prep sheets for the kitchen.",
        href: "/admin/production",
        icon: ChefHat,
        openTasks: 1,
      },
      {
        title: "Receipts",
        description: "Match vendor receipts and invoices.",
        href: "/admin/receipts",
        icon: Receipt,
        openTasks: 4,
      },
      {
        title: "Purchase orders",
        description: "Order food and supplies from vendors.",
        href: "/admin/procurement",
        icon: ClipboardList,
        openTasks: 2,
      },
      {
        title: "Vendors",
        description: "Supplier contacts and contracts.",
        href: "/admin/vendors",
        icon: Truck,
        openTasks: 1,
        importExportType: "vendors",
      },
    ],
  },
  {
    number: 4,
    id: "financials",
    title: "Money",
    cards: [
      {
        title: "Financial center",
        description: "Deposits, balances, and money reports.",
        href: "/admin/finance",
        icon: DollarSign,
        statusLabel: "Balanced",
        statusColor: "success",
      },
    ],
  },
  {
    number: 5,
    id: "intelligence",
    title: "Insights",
    cards: [
      {
        title: "Demand insights",
        description: "Read-only suggestions about demand and operations.",
        href: "/admin/intelligence",
        icon: Brain,
        statusLabel: "Read only",
        statusColor: "neutral",
      },
    ],
  },
  {
    number: 6,
    id: "communication",
    title: "Messages",
    cards: [
      {
        title: "Notices & alerts",
        description: "Parent notices, allergy reviews, and announcements.",
        href: "/admin/communication",
        icon: Megaphone,
        statusLabel: "3 pending",
        statusColor: "warning",
      },
    ],
  },
  {
    number: 7,
    id: "reporting",
    title: "Reports",
    cards: [
      {
        title: "Download reports",
        description: "Export kitchen and money reports.",
        href: "/admin/reporting",
        icon: BarChart3,
        statusLabel: "Available",
        statusColor: "success",
      },
    ],
  },
]

const STATUS_COLORS = {
  success: { bg: `${ADMIN_SUCCESS}22`, text: ADMIN_SUCCESS },
  warning: { bg: `${ADMIN_WARNING}33`, text: "#B7791F" },
  danger: { bg: `${ADMIN_DANGER}22`, text: ADMIN_DANGER },
  neutral: { bg: `${ADMIN_NAVY}10`, text: ADMIN_NAVY },
}

export function AdminDashboard() {
  const { user } = useAuth()
  const adminName = user?.displayName?.split(" ")[0] ?? "Admin"

  return (
    <div className="w-full px-6 py-8 md:px-8">
      <div className="mx-auto max-w-full space-y-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: ADMIN_NAVY }}>
            Welcome, {adminName}
          </h1>
          <p className="max-w-2xl text-sm md:text-base" style={{ color: ADMIN_SILVER }}>
            Start with a daily task below. Use the side menu anytime to jump to Menu, Cookbook, or
            Students.
          </p>
        </div>

        <section aria-labelledby="daily-tasks-heading">
          <h2
            id="daily-tasks-heading"
            className="mb-4 text-lg font-bold md:text-xl"
            style={{ color: ADMIN_NAVY }}
          >
            What do you want to do?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {DAILY_ACTIONS.map((card) => (
              <LauncherCardItem key={card.title} card={card} emphasize />
            ))}
          </div>
        </section>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: ADMIN_NAVY }}
              >
                {section.number}
              </span>
              <h2
                className="text-lg font-bold uppercase tracking-wide md:text-xl"
                style={{ color: ADMIN_NAVY }}
              >
                {section.title}
              </h2>
              {section.id === "intelligence" && (
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `${ADMIN_NAVY}12`, color: ADMIN_NAVY }}
                >
                  Read only
                </span>
              )}
            </div>
            {section.hint ? (
              <p className="mb-5 text-sm" style={{ color: ADMIN_SILVER }}>
                {section.hint}
              </p>
            ) : (
              <div className="mb-5" />
            )}

            <div
              className={
                section.cards.length === 1
                  ? "grid max-w-md gap-6"
                  : "grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              }
            >
              {section.cards.map((card) => (
                <LauncherCardItem key={card.title} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function LauncherCardItem({
  card,
  emphasize = false,
}: {
  card: LauncherCard
  emphasize?: boolean
}) {
  const Icon = card.icon
  const statusStyle = card.statusColor ? STATUS_COLORS[card.statusColor] : null

  return (
    <div
      className="group flex flex-col rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: emphasize ? ADMIN_NAVY : ADMIN_SILVER,
        backgroundColor: ADMIN_WHITE,
        borderWidth: emphasize ? 2 : 1,
      }}
    >
      <Link href={card.href} className="flex flex-1 flex-col">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: ADMIN_BG }}
        >
          <Icon className="h-5 w-5" style={{ color: ADMIN_NAVY }} />
        </div>

        <h3 className="mt-4 text-lg font-semibold" style={{ color: ADMIN_NAVY }}>
          {card.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: ADMIN_SILVER }}>
          {card.description}
        </p>

        {card.openTasks !== undefined && (
          <p className="mt-3 text-sm font-semibold" style={{ color: ADMIN_WARNING }}>
            {card.openTasks} open task{card.openTasks !== 1 ? "s" : ""}
          </p>
        )}

        {card.statusLabel && statusStyle && (
          <p
            className="mt-3 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            {card.statusLabel}
          </p>
        )}

        <div
          className="mt-5 flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2"
          style={{ color: ADMIN_NAVY }}
        >
          {emphasize ? "Go" : "Open"}
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>

      {card.importExportType && (
        <ImportExportMenu
          type={card.importExportType}
          variant="compact"
          onImport={() => {
            window.location.href = card.href
          }}
        />
      )}
    </div>
  )
}
