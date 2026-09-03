import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, GraduationCap, Lock, Users, UtensilsCrossed } from "lucide-react"
import type { PortalRole } from "@/components/providers/AuthProvider"

export type AccessPortalKey = "parent" | "staff" | "teacher" | "cashier" | "admin" | "student"

export interface AccessChoice {
  key: AccessPortalKey
  label: string
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
    icon: Users,
    loginRole: "parent",
    redirectTo: "/parent",
    registerRoute: "/login/parent/register",
  },
  {
    key: "student",
    label: "Student lunch orders",
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
    icon: Calculator,
    href: "/access/school/kiosk",
    enterLabel: "Open Cashier POS",
    secondaryHref: "/login/cashier",
    secondaryLabel: "Sign in for à la carte",
  },
  {
    key: "teacher",
    label: "Teacher portal",
    icon: BookOpen,
    loginRole: "teacher",
    redirectTo: "/teacher",
    registerRoute: "/login/teacher/register",
  },
  {
    key: "staff",
    label: "Staff portal",
    icon: UtensilsCrossed,
    loginRole: "staff",
    redirectTo: "/staff",
    registerRoute: "/login/staff/register",
  },
  {
    key: "student",
    label: "Student lunch portal",
    icon: GraduationCap,
    loginRole: "student",
    redirectTo: "/student",
  },
  {
    key: "admin",
    label: "Admin portal",
    icon: Lock,
    loginRole: "admin",
    redirectTo: "/admin",
  },
]
