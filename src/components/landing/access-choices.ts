import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, Lock, Users, UtensilsCrossed } from "lucide-react"
import type { PortalRole } from "@/components/providers/AuthProvider"

export type AccessPortalKey = "parent" | "staff" | "teacher" | "scanner" | "admin"

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

/** Order matches School Access UX: scanner, teacher, staff, admin. */
export const SCHOOL_CHOICES: AccessChoice[] = [
  {
    key: "scanner",
    label: "Lunch scanner",
    description: "Scan badges and ring up student lunch transactions.",
    icon: Calculator,
    href: "/kiosk",
    enterLabel: "Open scanner",
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
