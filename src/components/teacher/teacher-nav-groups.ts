import type { PortalNavCategory } from "@/components/nav/nav-types"

/** Teacher portal discovery groups. */
export const TEACHER_NAV_CATEGORIES: PortalNavCategory[] = [
  {
    id: "order-lunch",
    label: "Order lunch",
    items: [
      { label: "Lunch Calendar", href: "/teacher/calendar" },
      { label: "Add Funds", href: "/teacher/account" },
      { label: "View Transactions", href: "/teacher/transactions" },
    ],
  },
  {
    id: "signups",
    label: "Lunch signups list",
    shortLabel: "Lunch signups",
    items: [{ label: "Who signed up for lunch", href: "/teacher/who-signed-up" }],
  },
  {
    id: "badges",
    label: "Badges / photo",
    shortLabel: "Photo",
    items: [{ label: "Profile & photo", href: "/teacher/settings" }],
  },
  {
    id: "students-help",
    label: "Students sign-up help",
    shortLabel: "Students help",
    items: [
      { label: "Sign up a student", href: "/teacher/sign-up-student" },
      { label: "Student Lookup", href: "/teacher/student-lookup" },
    ],
  },
  {
    id: "messages",
    label: "Messages",
    items: [
      { label: "Announcements", href: "/teacher/announcements" },
      { label: "Messages", href: "/teacher/messages" },
    ],
  },
  {
    id: "guide",
    label: "Guide",
    items: [
      { label: "How-to guide", href: "/teacher/guide" },
      { label: "Help", href: "/teacher/help" },
    ],
  },
]
