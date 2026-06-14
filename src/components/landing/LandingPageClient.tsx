"use client"

import { BookOpen, Calculator, Lock, Users } from "lucide-react"
import { PortalCard, type PortalCardProps } from "@/components/landing/PortalCard"

const NAVY = "#041B52"

const PORTALS: PortalCardProps[] = [
  {
    portalName: "Lunch Cashier",
    description: "Manage transactions, meals, and student accounts.",
    color: "#0D7A3B",
    route: "/kiosk",
    icon: Calculator,
  },
  {
    portalName: "Parent Portal",
    description: "View student meals, balances, and nutrition information.",
    color: "#0B2D8F",
    route: "/login/parent",
    icon: Users,
  },
  {
    portalName: "Teacher Portal",
    description: "Assist students with lunch signup and manage your own meal.",
    color: NAVY,
    route: "/login/teacher",
    icon: BookOpen,
  },
  {
    portalName: "Admin Portal",
    description: "System administration, reports, and user management.",
    color: "#A85609",
    route: "/login/admin",
    icon: Lock,
  },
]

export function LandingPageClient() {
  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing-background.png')" }}
      />

      <main className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col items-center justify-end px-6 pb-[10vh] sm:pb-[12vh] lg:pb-[14vh]">
        <div className="w-full max-w-[1128px] text-center">
          <div className="mx-auto flex w-full flex-col items-center gap-6 md:flex-row md:flex-wrap md:justify-center lg:flex-nowrap lg:justify-center">
            {PORTALS.map((portal) => (
              <PortalCard key={portal.route} {...portal} />
            ))}
          </div>

          <div className="mx-auto mt-6">
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
      </main>
    </div>
  )
}
