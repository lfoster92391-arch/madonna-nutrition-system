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
import {
  ADMIN_BG,
  ADMIN_DANGER,
  ADMIN_NAVY,
  ADMIN_SILVER,
  ADMIN_SUCCESS,
  ADMIN_WARNING,
  ADMIN_WHITE,
} from "@/components/admin/layout/admin-theme"

type CardStatus = "ready" | "attention" | "pending" | "readonly"

interface LauncherCard {
  title: string
  description: string
  href: string
  icon: LucideIcon
  status: CardStatus
  statusLabel: string
  alerts?: number
  tasks?: number
}

interface LauncherSection {
  id: string
  title: string
  subtitle?: string
  cards: LauncherCard[]
}

const SECTIONS: LauncherSection[] = [
  {
    id: "get-started",
    title: "Get Started",
    subtitle: "Launch and configure your nutrition program",
    cards: [
      {
        title: "Setup Wizard",
        description: "Configure users, roles, and portal access.",
        href: "/admin/setup",
        icon: Wand2,
        status: "ready",
        statusLabel: "Ready",
      },
      {
        title: "Parent Imports",
        description: "Import student records and parent contacts from SIS.",
        href: "/admin/imports",
        icon: Upload,
        status: "attention",
        statusLabel: "2 pending",
      },
      {
        title: "Badge Setup",
        description: "Configure scan badges and student ID photos.",
        href: "/admin/badges",
        icon: IdCard,
        status: "ready",
        statusLabel: "Configured",
      },
      {
        title: "Pricing Setup",
        description: "Set meal prices, subsidies, and account rules.",
        href: "/admin/pricing",
        icon: BadgeDollarSign,
        status: "ready",
        statusLabel: "Active",
      },
      {
        title: "Launch Controls",
        description: "Go-live checklist and menu library readiness.",
        href: "/admin/launch",
        icon: Rocket,
        status: "pending",
        statusLabel: "Review",
      },
    ],
  },
  {
    id: "menu",
    title: "Menu",
    cards: [
      {
        title: "Menu Builder",
        description: "Create and manage weekly meal templates.",
        href: "/admin/menu",
        icon: UtensilsCrossed,
        status: "ready",
        statusLabel: "12 templates",
      },
      {
        title: "Calendar",
        description: "Schedule meals and publish service dates.",
        href: "/admin/calendar",
        icon: Calendar,
        status: "attention",
        statusLabel: "Draft week",
      },
      {
        title: "Calendar Design Studio",
        description: "Design printable menu boards and signage.",
        href: "/admin/calendar/design",
        icon: Palette,
        status: "ready",
        statusLabel: "3 designs",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    cards: [
      {
        title: "Receiving",
        description: "Log deliveries and verify purchase orders.",
        href: "/admin/receiving",
        icon: PackageCheck,
        status: "attention",
        statusLabel: "1 delivery",
        alerts: 1,
        tasks: 2,
      },
      {
        title: "Inventory",
        description: "Track stock levels, par counts, and transfers.",
        href: "/admin/inventory",
        icon: Package,
        status: "attention",
        statusLabel: "3 low stock",
        alerts: 3,
      },
      {
        title: "Production",
        description: "Daily prep sheets and kitchen workflow.",
        href: "/admin/production",
        icon: ChefHat,
        status: "ready",
        statusLabel: "On schedule",
        tasks: 1,
      },
      {
        title: "Receipts",
        description: "Reconcile vendor receipts and invoices.",
        href: "/admin/receipts",
        icon: Receipt,
        status: "pending",
        statusLabel: "4 to review",
        tasks: 4,
      },
      {
        title: "Procurement",
        description: "Purchase orders and reorder workflows.",
        href: "/admin/procurement",
        icon: ClipboardList,
        status: "ready",
        statusLabel: "2 open POs",
      },
      {
        title: "Vendors",
        description: "Manage supplier contacts and contracts.",
        href: "/admin/vendors",
        icon: Truck,
        status: "ready",
        statusLabel: "8 active",
      },
    ],
  },
  {
    id: "financials",
    title: "Financials",
    cards: [
      {
        title: "Finance Center",
        description: "Revenue, deposits, reconciliation, and reporting.",
        href: "/admin/finance",
        icon: DollarSign,
        status: "ready",
        statusLabel: "Balanced",
      },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    subtitle: "Read-only analytics and forecasting",
    cards: [
      {
        title: "Intelligence Hub",
        description: "Demand projections, AI suggestions, and operational insights.",
        href: "/admin/intelligence",
        icon: Brain,
        status: "readonly",
        statusLabel: "Read only",
      },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    cards: [
      {
        title: "Communication Hub",
        description: "Parent notices, allergy reviews, and announcements.",
        href: "/admin/communication",
        icon: Megaphone,
        status: "attention",
        statusLabel: "3 pending",
        alerts: 3,
      },
    ],
  },
  {
    id: "reporting",
    title: "Reporting",
    cards: [
      {
        title: "Reports Center",
        description: "Export operational and financial reports.",
        href: "/admin/reporting",
        icon: BarChart3,
        status: "ready",
        statusLabel: "Available",
      },
    ],
  },
]

const STATUS_STYLES: Record<CardStatus, { bg: string; text: string }> = {
  ready: { bg: `${ADMIN_SUCCESS}22`, text: ADMIN_SUCCESS },
  attention: { bg: `${ADMIN_WARNING}33`, text: ADMIN_NAVY },
  pending: { bg: `${ADMIN_SILVER}55`, text: ADMIN_NAVY },
  readonly: { bg: `${ADMIN_NAVY}12`, text: ADMIN_NAVY },
}

export function AdminDashboard() {
  return (
    <div className="w-full px-6 py-8 md:px-8">
      <div className="mx-auto max-w-full space-y-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ADMIN_SILVER }}>
            Operations Center
          </p>
          <h1 className="mt-1 text-3xl font-bold" style={{ color: ADMIN_NAVY }}>
            Department Launcher
          </h1>
          <p className="mt-2 max-w-2xl text-base" style={{ color: ADMIN_SILVER }}>
            Select a department module to begin work. Return here anytime to switch contexts.
          </p>
        </div>

        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: ADMIN_NAVY }}>
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="mt-0.5 text-sm" style={{ color: ADMIN_SILVER }}>
                    {section.subtitle}
                  </p>
                )}
              </div>
              {section.id === "intelligence" && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `${ADMIN_NAVY}15`, color: ADMIN_NAVY }}
                >
                  Read Only
                </span>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
  const statusStyle = STATUS_STYLES[card.status]

  return (
    <Link
      href={card.href}
      className="group flex flex-col rounded-2xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: ADMIN_SILVER, backgroundColor: ADMIN_WHITE }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: ADMIN_BG }}
        >
          <Icon className="h-5 w-5" style={{ color: ADMIN_NAVY }} />
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
        >
          {card.statusLabel}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold" style={{ color: ADMIN_NAVY }}>
        {card.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: ADMIN_SILVER }}>
        {card.description}
      </p>

      {(card.alerts || card.tasks) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {card.alerts ? (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${ADMIN_DANGER}18`, color: ADMIN_DANGER }}
            >
              {card.alerts} alert{card.alerts !== 1 ? "s" : ""}
            </span>
          ) : null}
          {card.tasks ? (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${ADMIN_WARNING}33`, color: ADMIN_NAVY }}
            >
              {card.tasks} task{card.tasks !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      )}

      <div
        className="mt-5 flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2"
        style={{ color: ADMIN_NAVY }}
      >
        Open
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  )
}
