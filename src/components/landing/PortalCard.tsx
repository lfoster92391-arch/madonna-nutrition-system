"use client"

import { useId } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { BookOpen, Calculator, ChevronDown, Lock, Users, UtensilsCrossed } from "lucide-react"
import { LoginForm } from "@/components/auth/LoginForm"
import type { PortalRole } from "@/components/providers/AuthProvider"
import { cn } from "@/lib/utils"

const NAVY = "#041B52"

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

export const SCHOOL_CHOICES: AccessChoice[] = [
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
    key: "teacher",
    label: "Teacher portal",
    description: "Student lunch signup and your own meal account.",
    icon: BookOpen,
    loginRole: "teacher",
    redirectTo: "/teacher",
    registerRoute: "/login/teacher/register",
  },
  {
    key: "scanner",
    label: "Lunch scanner",
    description: "Scan badges and ring up student lunch transactions.",
    icon: Calculator,
    href: "/kiosk",
    enterLabel: "Open scanner",
  },
  {
    key: "admin",
    label: "Admin",
    description: "Users, reports, and system administration.",
    icon: Lock,
    loginRole: "admin",
    redirectTo: "/admin",
  },
]

interface AccessBlockProps {
  title: string
  subtitle: string
  accent: string
  choices: AccessChoice[]
  activeKey: AccessPortalKey | null
  onSelect: (key: AccessPortalKey | null) => void
  index?: number
}

export function AccessBlock({
  title,
  subtitle,
  accent,
  choices,
  activeKey,
  onSelect,
  index = 0,
}: AccessBlockProps) {
  const reactId = useId()
  const headingId = `access-${title.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <section
      className="landing-card-enter flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/35 bg-white/92 shadow-[0_8px_28px_rgba(4,27,82,0.16)] backdrop-blur-md max-md:rounded-[18px]"
      style={{ animationDelay: `${index * 80}ms` }}
      aria-labelledby={headingId}
    >
      <header
        className="border-b border-[#041B52]/10 px-4 py-3.5 text-left sm:px-5"
        style={{ borderTop: `4px solid ${accent}` }}
      >
        <h2
          id={headingId}
          className="text-lg font-bold tracking-tight sm:text-xl"
          style={{ color: NAVY }}
        >
          {title}
        </h2>
        <p className="mt-0.5 text-sm font-medium text-[#475569]">{subtitle}</p>
      </header>

      <div className="flex flex-col gap-2 p-3 sm:p-4" role="list">
        {choices.map((choice) => {
          const Icon = choice.icon
          const isOpen = activeKey === choice.key
          const panelId = `${reactId}-${choice.key}-panel`

          return (
            <div key={choice.key} className="min-w-0" role="listitem">
              <button
                type="button"
                onClick={() => onSelect(isOpen ? null : choice.key)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={cn(
                  "flex w-full min-h-12 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2",
                  isOpen
                    ? "bg-[#041B52] text-white shadow-sm"
                    : "bg-[#041B52]/[0.04] text-[#041B52] hover:bg-[#041B52]/[0.08]"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    isOpen ? "bg-white/20" : "bg-white"
                  )}
                  style={!isOpen ? { color: accent } : undefined}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={1.85} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold leading-tight">{choice.label}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform",
                    isOpen ? "rotate-180 text-white/80" : "text-[#94A3B8]"
                  )}
                  aria-hidden
                />
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  className="mt-2 rounded-xl border border-[#041B52]/10 bg-[#F8FAFC] p-3 sm:p-4"
                  role="region"
                  aria-label={`${choice.label} actions`}
                >
                  <p className="mb-3 text-left text-sm text-[#475569]">{choice.description}</p>

                  {choice.href ? (
                    <Link
                      href={choice.href}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2 sm:w-auto sm:min-w-[180px]"
                      style={{ backgroundColor: accent }}
                    >
                      {choice.enterLabel ?? "Continue"}
                    </Link>
                  ) : choice.loginRole && choice.redirectTo ? (
                    <div className="space-y-3">
                      <LoginForm
                        role={choice.loginRole}
                        redirectTo={choice.redirectTo}
                        variant="embedded"
                      />
                      {choice.registerRoute ? (
                        <p className="text-center text-sm text-[#64748B]">
                          New here?{" "}
                          <Link
                            href={choice.registerRoute}
                            className="font-semibold underline-offset-2 hover:underline"
                            style={{ color: NAVY }}
                          >
                            Create an account
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
