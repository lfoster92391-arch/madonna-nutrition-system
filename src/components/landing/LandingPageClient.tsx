"use client"

import Link from "next/link"
import { School, Users } from "lucide-react"
import { LandingShell } from "@/components/landing/LandingShell"
import { BRAND } from "@/config/brand"

const NAVY = "#041B52"
const PARENT_ACCENT = "#0B2D8F"
const SCHOOL_ACCENT = "#0D7A3B"

const GATES = [
  {
    href: "/access/parent",
    title: "Parent Access",
    subtitle: "For families",
    accent: PARENT_ACCENT,
    icon: Users,
  },
  {
    href: "/access/school",
    title: "School Access",
    subtitle: "Campus portals and lunch line",
    accent: SCHOOL_ACCENT,
    icon: School,
  },
] as const

/** Public first screen: only Parent Access and School Access. */
export function LandingPageClient() {
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
          className="mt-2 text-2xl font-bold sm:text-3xl"
          style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
        >
          Where do you need to go?
        </h1>
        <p
          className="mx-auto mt-2 max-w-xl text-sm font-medium leading-snug text-gray-600 sm:text-base"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
        >
          {BRAND.tagline}
        </p>
      </header>

      <div className="mx-auto grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {GATES.map((gate, index) => {
          const Icon = gate.icon
          return (
            <Link
              key={gate.href}
              href={gate.href}
              className="landing-card-enter flex w-full min-w-0 min-h-[7.5rem] flex-col justify-center gap-3 rounded-2xl border border-white/35 bg-white/92 px-5 py-5 text-left shadow-[0_8px_28px_rgba(4,27,82,0.16)] backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#041B52] focus-visible:ring-offset-2 max-md:rounded-[18px] sm:min-h-[8.5rem] sm:px-6 sm:py-6"
              style={{
                borderTop: `4px solid ${gate.accent}`,
                animationDelay: `${index * 80}ms`,
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white"
                  style={{ color: gate.accent }}
                  aria-hidden
                >
                  <Icon className="h-6 w-6" strokeWidth={1.85} />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold tracking-tight sm:text-xl" style={{ color: NAVY }}>
                    {gate.title}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium text-[#475569]">{gate.subtitle}</span>
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </LandingShell>
  )
}
