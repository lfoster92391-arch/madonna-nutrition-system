"use client"

import { BookOpen, Calculator, Lock, Users, UtensilsCrossed } from "lucide-react"
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
    description: "Meals, balances, and nutrition for your child.",
    color: "#0B2D8F",
    route: "/login/parent",
    icon: Users,
  },
  {
    portalName: "Teacher Portal",
    roleLabel: "For teachers",
    description: "Student lunch signup and your own meal account.",
    color: NAVY,
    route: "/login/teacher",
    icon: BookOpen,
  },
  {
    portalName: "Staff Portal",
    roleLabel: "For staff",
    description: "Lunch calendar, announcements, and your account.",
    color: "#1B4332",
    route: "/login/staff",
    icon: UtensilsCrossed,
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
    <div className="relative min-h-screen min-h-[100dvh] w-full max-md:overflow-x-hidden md:overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat max-md:scale-105 max-md:opacity-35 md:opacity-100"
        style={{ backgroundImage: "url('/landing-background.png')" }}
      />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 max-md:bg-white/55 max-md:backdrop-blur-md md:hidden"
      />

      <main className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col items-center justify-end px-6 pb-[10vh] max-md:justify-start max-md:px-4 max-md:pb-[max(env(safe-area-inset-bottom),1.25rem)] max-md:pt-[max(env(safe-area-inset-top),1rem)] sm:pb-[12vh] lg:pb-[14vh]">
        <div className="flex w-full max-w-[1128px] flex-col text-center">
          <div className="order-1 md:order-2">
            <header className="mb-4 max-md:block md:hidden">
              <p
                className="text-base font-bold leading-tight"
                style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
              >
                Madonna Nutrition Management System
              </p>
              <h1
                className="mt-2 text-xl font-bold"
                style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
              >
                Choose Your Portal
              </h1>
              <p
                className="mt-1.5 text-sm font-medium leading-snug text-gray-600"
                style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
              >
                Secure access for students, parents, teachers, staff, and administrators.
              </p>
            </header>

            <div className="mx-auto mt-6 max-md:hidden">
              <h1
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: NAVY, textShadow: "0 1px 3px rgba(255,255,255,0.5)" }}
              >
                Choose Your Portal
              </h1>
              <p
                className="mt-2 text-sm text-gray-600 sm:text-base"
                style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
              >
                Select the portal you would like to access.
              </p>
            </div>
          </div>

          <div className="order-2 mx-auto grid w-full grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:order-1 md:flex md:flex-row md:flex-wrap md:justify-center md:gap-6 lg:flex-nowrap lg:justify-center">
            {PORTALS.map((portal, index) => (
              <PortalCard key={portal.route} {...portal} index={index} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
