import type { PortalNavCategory } from "@/components/nav/nav-types"

/** Student portal — limited options. */
export const STUDENT_NAV_CATEGORIES: PortalNavCategory[] = [
  {
    id: "order-menu",
    label: "Order lunch / Menu",
    shortLabel: "Order lunch",
    items: [
      { label: "Order lunch", href: "/student/order" },
      { label: "My orders", href: "/student/orders" },
    ],
  },
  {
    id: "guide",
    label: "Guide",
    items: [{ label: "How-to guide", href: "/student/guide" }],
  },
]
