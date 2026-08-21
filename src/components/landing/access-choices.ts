import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, Lock, Users, UtensilsCrossed } from "lucide-react"
import type { PortalRole } from "@/components/providers/AuthProvider"

export type AccessPortalKey = "parent" | "staff" | "teacher" | "cashier" | "admin"

export interface AccessChoice {
  key: AccessPortalKey
  label: string
  description: string
  icon: LucideIcon
  loginRole?: Exclude<PortalRole, null>
  redirectTo?: string
  registerRoute?: string
  href?: string
  enterLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export const PARENT_CHOICES: AccessChoice[] = [
  {
    key: "parent",
    label: "Parent portal",
    description: "Meals, balances, and nutrition for your children.",
    icon: Users,
    loginRole: "parent",
    redirectTo: "/parent",
    registerRoute: "/login/parent/register",
  },
]

/** Order matches School Access UX: Cashier/POS first, then teacher, staff, admin. */
export const SCHOOL_CHOICES: AccessChoice[] = [
  {
    key: "cashier",
    label: "Cashier / POS",
    description:
      "Lunch line station — scan student MD IDs or staff badges and ring up meals. Button prices come from Admin → Kiosk / POS.",
    icon: Calculator,
    href: "/kiosk",
    enterLabel: "Open Cashier POS",
    secondaryHref: "/login/cashier",
    secondaryLabel: "Sign in for à la carte",
  },
  {
    key: "teacher",
    label: "Teacher portal",
    description: "Student lunch signup and your own meal account.",
    icon: BookOpen,
    loginRole: "teacher",
    redirectTo: "/teacher",
    registerRoute: "/login/teacher/register",
  },
  {
    key: "staff",
    label: "Staff portal",
    description: "Lunch calendar, announcements, and your account.",
    icon: UtensilsCrossed,
    loginRole: "staff",
    redirectTo: "/staff",
    registerRoute: "/login/staff/register",
  },
  {
    key: "admin",
    label: "Admin portal",
    description: "Users, reports, and system administration.",
    icon: Lock,
    loginRole: "admin",
    redirectTo: "/admin",
  },
]
