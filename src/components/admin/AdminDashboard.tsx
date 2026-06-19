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
  Rocket,
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
  cards: LauncherCard[]
}

const SECTIONS: LauncherSection[] = [
  {
    number: 1,
    id: "get-started",
    title: "Get Started",
    cards: [
      {
        title: "Setup Wizard",
        description: "Configure users, roles, and portal access.",
        href: "/admin/setup",
        icon: Wand2,
      },
      {
        title: "Parent Imports",
        description: "Import student records and parent contacts from SIS.",
        href: "/admin/imports",
        icon: Upload,
        statusLabel: "2 pending",
        statusColor: "warning",
        importExportType: "students",
      },
      {
        title: "Badge Setup",
        description: "Configure scan badges and student ID photos.",
        href: "/admin/badges",
        icon: IdCard,
        importExportType: "badges",
      },
      {
        title: "Pricing Setup",
        description: "Set meal prices, subsidies, and account rules.",
        href: "/admin/pricing",
        icon: BadgeDollarSign,
      },
      {
        title: "Launch Controls",
        description: "Go-live checklist and menu library readiness.",
        href: "/admin/launch",
        icon: Rocket,
        statusLabel: "Review needed",
        statusColor: "warning",
      },
    ],
  },
  {
    number: 2,
    id: "menu",
    title: "Menu Management",
    cards: [
      {
        title: "Menu Builder",
        description: "Create and manage weekly meal templates.",
        href: "/admin/menu",
        icon: UtensilsCrossed,
        statusLabel: "12 templates",
        statusColor: "neutral",
        importExportType: "menu",
      },
      {
        title: "Calendar",
        description: "Schedule meals and publish service dates.",
        href: "/admin/calendar",
        icon: Calendar,
        statusLabel: "Draft week",
        statusColor: "warning",
      },
      {
        title: "Calendar Design Studio",
        description: "Design printable menu boards and signage.",
        href: "/admin/calendar/design",
        icon: Palette,
        statusLabel: "3 designs",
        statusColor: "neutral",
      },
    ],
  },
  {
    number: 3,
    id: "operations",
    title: "Operations",
    cards: [
      {
        title: "Receiving Studio",
        description: "Log deliveries and verify purchase orders.",
        href: "/admin/receiving",
        icon: PackageCheck,
        openTasks: 2,
      },
      {
        title: "Inventory",
        description: "Track stock levels, par counts, and transfers.",
        href: "/admin/inventory",
        icon: Package,
        openTasks: 3,
        importExportType: "inventory",
      },
      {
        title: "Production Center",
        description: "Daily prep sheets and kitchen workflow.",
        href: "/admin/production",
        icon: ChefHat,
        openTasks: 1,
      },
      {
        title: "Receipts",
        description: "Reconcile vendor receipts and invoices.",
        href: "/admin/receipts",
        icon: Receipt,
        openTasks: 4,
      },
      {
        title: "Procurement",
        description: "Purchase orders and reorder workflows.",
        href: "/admin/procurement",
        icon: ClipboardList,
        openTasks: 2,
      },
      {
        title: "Vendors",
        description: "Manage supplier contacts and contracts.",
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
    title: "Financials",
    cards: [
      {
        title: "Financial Center",
        description: "Revenue, deposits, reconciliation, and reporting.",
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
    title: "Intelligence",
    cards: [
      {
        title: "Intelligence Engine",
        description: "Demand projections, AI suggestions, and operational insights.",
        href: "/admin/intelligence",
        icon: Brain,
        statusLabel: "Read Only",
        statusColor: "neutral",
      },
    ],
  },
  {
    number: 6,
    id: "communication",
    title: "Communication",
    cards: [
      {
        title: "Communication Center",
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
    title: "Reporting",
    cards: [
      {
        title: "Reporting Center",
        description: "Export operational and financial reports.",
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
        <div className="space-y-4">
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: ADMIN_NAVY }}>
            Welcome back, {adminName}!
          </h1>
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: `${ADMIN_SUCCESS}18`, color: ADMIN_SUCCESS }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ADMIN_SUCCESS }} />
            All systems operational
          </div>
        </div>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="mb-5 flex flex-wrap items-center gap-3">
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
                  Read Only
                </span>
              )}
            </div>

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

function LauncherCardItem({ card }: { card: LauncherCard }) {
  const Icon = card.icon
  const statusStyle = card.statusColor ? STATUS_COLORS[card.statusColor] : null

  return (
    <div
      className="group flex flex-col rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: ADMIN_SILVER, backgroundColor: ADMIN_WHITE }}
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
            {card.openTasks} Open Task{card.openTasks !== 1 ? "s" : ""}
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
          Open
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
