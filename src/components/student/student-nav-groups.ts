import type { PortalNavCategory } from "@/components/nav/nav-types"

/** Student portal — limited options (order lunch only; no funds/photos). */
export const STUDENT_NAV_CATEGORIES: PortalNavCategory[] = [
  {
    id: "order-menu",
    label: "Order lunch / Menu",
    shortLabel: "Order lunch",
    items: [
      { label: "Order lunch", href: "/student/order" },
      { label: "Lunch calendar", href: "/student/calendar" },
      { label: "My orders", href: "/student/orders" },
    ],
  },
]
