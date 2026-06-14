"use client"

import { Calculator, Lock, Users } from "lucide-react"
import { PortalCard, type PortalCardProps } from "@/components/landing/PortalCard"

const NAVY = "#001E62"

const PORTALS: PortalCardProps[] = [
  {
    portalName: "Lunch Cashier",
    description: "Manage transactions, meals, and student accounts.",
    color: "#0D7A3B",
    route: "/login/cashier",
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

      <main className="relative z-10 flex min-h-screen min-h-[100dvh] w-full flex-col items-center justify-start px-6 pb-[12vh] pt-[28vh] sm:pb-[14vh] sm:pt-[30vh] lg:pb-[16vh] lg:pt-[32vh]">
        <div className="w-full max-w-5xl text-center">
          <div className="mx-auto inline-block rounded-2xl bg-white/80 px-6 py-4 backdrop-blur-sm">
            <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: NAVY }}>
              Choose Your Portal
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Select the portal you would like to access.
            </p>
          </div>

          <div className="mx-auto mt-8 grid w-full grid-cols-1 place-items-center gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {PORTALS.map((portal) => (
              <PortalCard key={portal.route} {...portal} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
