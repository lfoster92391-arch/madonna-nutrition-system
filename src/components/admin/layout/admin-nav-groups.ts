/**
 * Shared Admin discovery map: top-level categories → destination pages.
 * Used by the Admin home hub and sidebar. Preserve every route; only regroup UX.
 */

export type AdminNavItem = {
  label: string
  href: string
}

export type AdminNavCategory = {
  id: string
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_CATEGORIES: AdminNavCategory[] = [
  {
    id: "students",
    label: "Students",
    items: [
      { label: "Student import", href: "/admin/imports?tab=students" },
      { label: "Student badges", href: "/admin/badges" },
      { label: "Student accounts", href: "/admin/imports" },
      { label: "Lunch agreements", href: "/admin/agreements" },
      { label: "Allergy review", href: "/admin/allergy-review" },
      { label: "Sign up a student", href: "/admin/sign-up-student" },
    ],
  },
  {
    id: "menu",
    label: "Menu management",
    items: [
      { label: "Cookbook", href: "/admin/cookbook" },
      { label: "Lunch menu", href: "/admin/calendar" },
      { label: "Pricing setup", href: "/admin/pricing" },
      { label: "Kiosk buttons", href: "/admin/kiosk-buttons" },
      { label: "Menu library", href: "/admin/menu-library" },
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen",
    items: [
      { label: "Kitchen board", href: "/admin/kitchen" },
      { label: "Today’s lunch line", href: "/admin/kitchen/orders" },
      { label: "Sunday head count", href: "/admin/kitchen/sunday-head-count" },
      { label: "Production", href: "/admin/production" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { label: "Deliveries", href: "/admin/receiving" },
      { label: "Inventory", href: "/admin/inventory" },
      { label: "Vendors", href: "/admin/procurement" },
      { label: "Receipts", href: "/admin/receipts" },
    ],
  },
  {
    id: "financials",
    label: "Financials",
    items: [
      { label: "Groceries", href: "/admin/finance?tab=groceries" },
      { label: "Expenses & reports", href: "/admin/finance?tab=reports" },
      { label: "Add or take money", href: "/admin/imports?tab=students" },
      { label: "Reporting", href: "/admin/reporting" },
    ],
  },
  {
    id: "people",
    label: "People & access",
    items: [
      { label: "Users", href: "/admin/users" },
      { label: "Parents & family", href: "/admin/imports?tab=families" },
      { label: "Staff accounts", href: "/admin/imports?tab=staff" },
      { label: "Portal preview", href: "/admin/parent-preview" },
      { label: "Support contacts", href: "/admin/support" },
    ],
  },
  {
    id: "communications",
    label: "Communications",
    items: [{ label: "Announcements & messages", href: "/admin/communication" }],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { label: "Intelligence", href: "/admin/intelligence" },
      { label: "Analytics", href: "/admin/analytics" },
      { label: "Forecasting", href: "/admin/forecasting" },
    ],
  },
  {
    id: "settings",
    label: "Settings & help",
    items: [
      { label: "How to use", href: "/admin/setup" },
      { label: "Settings", href: "/admin/settings" },
      { label: "Audit log", href: "/admin/audit-log" },
    ],
  },
]

/** Flat list of every destination for search / completeness checks. */
export function flattenAdminNavItems(): AdminNavItem[] {
  return ADMIN_NAV_CATEGORIES.flatMap((c) => c.items)
}
