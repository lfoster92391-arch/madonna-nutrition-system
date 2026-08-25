"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  Brain,
  ChefHat,
  DollarSign,
  IdCard,
  Megaphone,
  MonitorSmartphone,
  Package,
  PackageCheck,
  Receipt,
  Truck,
  Upload,
  Users,
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
        title: "How to Use Fuel The Dons",
        description: "Step-by-step guide for cafeteria workers — Menu, students, lunch line, and payments.",
        href: "/admin/setup",
        icon: Wand2,
      },
      {
        title: "Students & Imports",
        description: "Add students, edit info, upload photos, and record office payments.",
        href: "/admin/imports",
        icon: Upload,
        statusLabel: "Students",
        statusColor: "neutral",
        importExportType: "students",
      },
      {
        title: "Badge Setup",
        description: "Link barcodes and print student or staff badge photos from each profile.",
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
        title: "Kiosk / POS Buttons",
        description: "Customize lunch kiosk charge buttons — labels, prices, order, and who sees them.",
        href: "/admin/kiosk-buttons",
        icon: MonitorSmartphone,
      },
    ],
  },
  {
    number: 2,
    id: "menu",
    title: "Menu Management",
    cards: [
      {
        title: "Cookbook",
        description: "Saved meals with photos — Recipes, Lunches, Sides, and more.",
        href: "/admin/cookbook",
        icon: ChefHat,
        statusLabel: "Reusable library",
        statusColor: "neutral",
        importExportType: "menu",
      },
      {
        title: "Lunch menu",
        description: "Schedule meals and publish service dates on the lunch calendar.",
        href: "/admin/calendar",
        icon: UtensilsCrossed,
        statusLabel: "This week",
        statusColor: "warning",
      },
    ],
  },
  {
    number: 3,
    id: "operations",
    title: "Operations",
    cards: [
      {
        title: "Deliveries",
        description: "Log vendor deliveries and approve stock into inventory.",
        href: "/admin/receiving",
        icon: PackageCheck,
      },
      {
        title: "Inventory",
        description: "See what’s on the shelf after grocery purchases and deliveries.",
        href: "/admin/inventory",
        icon: Package,
        importExportType: "inventory",
      },
      {
        title: "Kitchen board",
        description: "TV view of who ordered lunch, who was served, and pizza slice totals.",
        href: "/admin/kitchen",
        icon: ChefHat,
      },
      {
        title: "Today’s lunch line",
        description: "How many people are eating today and what was ordered — before you prep.",
        href: "/admin/kitchen/orders",
        icon: ChefHat,
      },
      {
        title: "Sign up a student",
        description: "Search any student and reserve published lunch days for kitchen counts.",
        href: "/admin/sign-up-student",
        icon: Users,
      },
      {
        title: "Production Center",
        description: "Daily prep sheets and kitchen workflow.",
        href: "/admin/production",
        icon: ChefHat,
      },
      {
        title: "Receipts",
        description: "Upload and match vendor receipts.",
        href: "/admin/receipts",
        icon: Receipt,
      },
      {
        title: "Vendors",
        description: "Manage supplier contacts.",
        href: "/admin/procurement",
        icon: Truck,
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
        title: "Groceries",
        description: "Add what you bought — item, quantity, cost, and store.",
        href: "/admin/finance?tab=groceries",
        icon: Package,
      },
      {
        title: "Expenses & reports",
        description: "See grocery spend and meal revenue. Parent payments stay in the portal.",
        href: "/admin/finance?tab=reports",
        icon: DollarSign,
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
    <div className="admin-page-pad">
      <div className="mx-auto max-w-full space-y-6 sm:space-y-10">
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl" style={{ color: ADMIN_NAVY }}>
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
                  ? "grid max-w-md gap-3 sm:gap-6"
                  : "grid gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4"
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
      className="group flex flex-col rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
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
