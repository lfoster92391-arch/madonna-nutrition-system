"use client"

import Link from "next/link"
import { School, Users } from "lucide-react"
import { LandingShell } from "@/components/landing/LandingShell"
import { BRAND } from "@/config/brand"

const NAVY = "#041B52"

const GATES = [
  {
    href: "/access/parent",
    title: "Parent Access",
    icon: Users,
  },
  {
    href: "/access/school",
    title: "School Access",
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

      <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-3 sm:gap-4">
        {GATES.map((gate, index) => {
          const Icon = gate.icon
          return (
            <Link
              key={gate.href}
              href={gate.href}
              className="landing-card-enter madonna-option-btn madonna-option-btn--rounded flex w-full min-h-14 items-center justify-center gap-3 px-5 py-4 text-center sm:min-h-16 sm:px-6"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <Icon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" strokeWidth={1.85} aria-hidden />
              <span className="text-base font-bold tracking-tight sm:text-lg">{gate.title}</span>
            </Link>
          )
        })}
      </div>
    </LandingShell>
  )
}
