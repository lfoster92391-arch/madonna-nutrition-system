import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, GraduationCap, Lock, Users, UtensilsCrossed } from "lucide-react"
import type { PortalRole } from "@/components/providers/AuthProvider"

export type AccessPortalKey = "parent" | "staff" | "teacher" | "cashier" | "admin" | "student"

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
  {
    key: "student",
    label: "Student lunch orders",
    description: "Students sign in with MD ID or school email to order their own lunch.",
    icon: GraduationCap,
    loginRole: "student",
    redirectTo: "/student",
  },
]

/** Order matches School Access UX: Cashier/POS first, then teacher, staff, student, admin. */
export const SCHOOL_CHOICES: AccessChoice[] = [
  {
    key: "cashier",
    label: "Cashier / POS",
    description:
      "Lunch line station — scan student MD IDs or staff badges and ring up meals. Button prices come from Admin → Kiosk / POS.",
    icon: Calculator,
    href: "/access/school/kiosk",
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
    key: "student",
    label: "Student lunch portal",
    description: "Order your own school lunch. Parents still manage funds and photos.",
    icon: GraduationCap,
    loginRole: "student",
    redirectTo: "/student",
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
