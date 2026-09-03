import type { PortalNavCategory } from "@/components/nav/nav-types"

/** Staff portal discovery groups. */
export const STAFF_NAV_CATEGORIES: PortalNavCategory[] = [
  {
    id: "order-lunch",
    label: "Order lunch",
    items: [
      { label: "Lunch Calendar", href: "/staff/calendar" },
      { label: "My Account", href: "/staff/account" },
      { label: "Transactions", href: "/staff/transactions" },
    ],
  },
  {
    id: "signups",
    label: "Lunch signups list",
    shortLabel: "Lunch signups",
    items: [{ label: "Who signed up for lunch", href: "/staff/who-signed-up" }],
  },
  {
    id: "badges",
    label: "Badges / photo",
    shortLabel: "Photo",
    items: [{ label: "Profile & photo", href: "/staff/settings" }],
  },
  {
    id: "students-help",
    label: "Students sign-up help",
    shortLabel: "Students help",
    items: [{ label: "Sign up a student", href: "/staff/sign-up-student" }],
  },
  {
    id: "messages",
    label: "Messages",
    items: [
      { label: "Announcements", href: "/staff/announcements" },
      { label: "Messages", href: "/staff/messages" },
    ],
  },
  {
    id: "guide",
    label: "Guide",
    items: [
      { label: "How-to guide", href: "/staff/guide" },
      { label: "Help", href: "/staff/help" },
    ],
  },
]
