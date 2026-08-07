"use client"

import { BookOpen, Calculator, Lock, Users, UtensilsCrossed } from "lucide-react"
import { BRAND } from "@/config/brand"
import { PortalCard, type PortalCardProps } from "@/components/landing/PortalCard"

const NAVY = "#041B52"

const PORTALS: PortalCardProps[] = [
  {
    portalName: "Scanner / Kiosk",
    roleLabel: "Cafeteria checkout",
    description: "Scan badges and ring up student lunch transactions.",
    color: "#0D7A3B",
    route: "/kiosk",
    icon: Calculator,
  },
  {
    portalName: "Parent Portal",
    roleLabel: "For parents",
    description: "Meals, balances, and nutrition for your children.",
    color: "#0B2D8F",
    route: "/login/parent",
    icon: Users,
    primaryLabel: "Log in",
    secondaryAction: {
      label: "Create an account",
      route: "/login/parent/register",
    },
  },
  {
    portalName: "Teacher Portal",
    roleLabel: "For teachers",
    description: "Student lunch signup and your own meal account.",
    color: NAVY,
    route: "/login/teacher",
    icon: BookOpen,
    primaryLabel: "Log in",
    secondaryAction: {
      label: "Create an account",
      route: "/login/teacher/register",
    },
  },
  {
    portalName: "Staff Portal",
    roleLabel: "For staff",
    description: "Lunch calendar, announcements, and your account.",
    color: "#1B4332",
    route: "/login/staff",
    icon: UtensilsCrossed,
    primaryLabel: "Log in",
    secondaryAction: {
      label: "Create an account",
      route: "/login/staff/register",
    },
  },
  {
    portalName: "Admin Portal",
    roleLabel: "For administrators",
    description: "Users, reports, and system administration.",
    color: "#A85609",
    route: "/login/admin",
    icon: Lock,
  },
]

export function LandingPageClient() {
  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat max-md:scale-105 max-md:opacity-35 md:opacity-100"
        style={{ backgroundImage: "url('/landing-background.png')" }}
      />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 max-md:bg-white/55 max-md:backdrop-blur-md md:hidden"
      />

      <main className="relative z-10 flex min-h-screen min-h-[100dvh] w-full max-w-[100vw] flex-col items-center justify-end px-4 pb-[10vh] max-md:justify-start max-md:pb-[max(env(safe-area-inset-bottom),1.25rem)] max-md:pt-[max(env(safe-area-inset-top),1rem)] sm:px-6 sm:pb-[12vh] lg:pb-[14vh]">
        <div className="flex w-full min-w-0 max-w-[1128px] flex-col items-center text-center">
          <header className="mb-6 w-full min-w-0 md:mb-8">
            <p
              className="text-sm font-bold uppercase tracking-[0.2em] sm:text-base"
              style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
            >
              {BRAND.productName}
            </p>
            <h1
              className="mt-2 text-2xl font-bold sm:text-3xl"
              style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
            >
              Choose Your Portal
            </h1>
            <p
              className="mx-auto mt-2 max-w-xl text-sm font-medium leading-snug text-gray-600 sm:text-base"
              style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
            >
              {BRAND.tagline} Secure access for parents, teachers, staff, and administrators.
            </p>
          </header>

          <div className="mx-auto grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:flex-row md:flex-wrap md:justify-center md:gap-4 lg:gap-5">
            {PORTALS.map((portal, index) => (
              <PortalCard key={portal.route} {...portal} index={index} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
