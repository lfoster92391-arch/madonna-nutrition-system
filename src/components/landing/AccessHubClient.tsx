"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { LoginForm } from "@/components/auth/LoginForm"
import { LandingShell } from "@/components/landing/LandingShell"
import type { AccessChoice, AccessPortalKey } from "@/components/landing/access-choices"
import { BRAND } from "@/config/brand"
import { cn } from "@/lib/utils"

const NAVY = "#041B52"

interface AccessHubProps {
  title: string
  subtitle: string
  accent: string
  choices: AccessChoice[]
  /** When true and there is a single choice, show login/actions immediately. */
  expandSingleByDefault?: boolean
}

export function AccessHubClient({
  title,
  subtitle,
  accent,
  choices,
  expandSingleByDefault = false,
}: AccessHubProps) {
  const reactId = useId()
  const headingId = `access-hub-${title.replace(/\s+/g, "-").toLowerCase()}`
  const defaultKey =
    expandSingleByDefault && choices.length === 1 ? choices[0].key : null
  const [activeKey, setActiveKey] = useState<AccessPortalKey | null>(defaultKey)

  return (
    <LandingShell>
      <header className="mb-5 w-full min-w-0 md:mb-7">
        <p
          className="text-base font-bold uppercase tracking-[0.18em] sm:text-lg"
          style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
        >
          {BRAND.productName}
        </p>
        <h1
          id={headingId}
          className="mt-2 text-2xl font-bold sm:text-3xl"
          style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
        >
          {title}
        </h1>
        <p
          className="mx-auto mt-2 max-w-xl text-sm font-medium leading-snug text-gray-600 sm:text-base"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
        >
          {subtitle}
        </p>
        <p className="mt-3">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
            style={{ color: NAVY }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to access choices
          </Link>
        </p>
      </header>

      <section
        className="landing-card-enter w-full min-w-0 overflow-hidden rounded-2xl border border-white/35 bg-white/92 shadow-[0_8px_28px_rgba(4,27,82,0.16)] backdrop-blur-md max-md:rounded-[18px]"
        style={{ borderTop: `4px solid ${accent}` }}
        aria-labelledby={headingId}
      >
        <div className="flex flex-col gap-2 p-3 sm:p-4" role="list">
          {choices.map((choice) => {
            const Icon = choice.icon
            const isOpen = activeKey === choice.key
            const panelId = `${reactId}-${choice.key}-panel`

            return (
              <div key={choice.key} className="min-w-0" role="listitem">
                <button
                  type="button"
                  onClick={() => setActiveKey(isOpen ? null : choice.key)}
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
    </LandingShell>
  )
}
