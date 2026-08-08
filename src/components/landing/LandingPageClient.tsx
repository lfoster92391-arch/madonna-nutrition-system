"use client"

import { useState } from "react"
import { BRAND } from "@/config/brand"
import {
  AccessBlock,
  PARENT_CHOICES,
  SCHOOL_CHOICES,
  type AccessPortalKey,
} from "@/components/landing/PortalCard"

const NAVY = "#041B52"
const PARENT_ACCENT = "#0B2D8F"
const SCHOOL_ACCENT = "#0D7A3B"

export function LandingPageClient() {
  const [parentActive, setParentActive] = useState<AccessPortalKey | null>(null)
  const [schoolActive, setSchoolActive] = useState<AccessPortalKey | null>(null)

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

      <main className="relative z-10 flex min-h-screen min-h-[100dvh] w-full max-w-[100vw] flex-col items-center justify-end px-4 pb-[8vh] max-md:justify-start max-md:pb-[max(env(safe-area-inset-bottom),1.25rem)] max-md:pt-[max(env(safe-area-inset-top),1rem)] sm:px-6 sm:pb-[10vh] lg:pb-[12vh]">
        <div className="flex w-full min-w-0 max-w-[920px] flex-col items-center text-center">
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
              {BRAND.tagline} Pick Parent Access or School Access, then sign in inside that block.
            </p>
          </header>

          <div className="mx-auto grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:items-start md:gap-5">
            <AccessBlock
              title="Parent Access"
              subtitle="For families"
              accent={PARENT_ACCENT}
              choices={PARENT_CHOICES}
              activeKey={parentActive}
              onSelect={setParentActive}
              index={0}
            />
            <AccessBlock
              title="School Access"
              subtitle="Staff, teachers, and lunch line"
              accent={SCHOOL_ACCENT}
              choices={SCHOOL_CHOICES}
              activeKey={schoolActive}
              onSelect={setSchoolActive}
              index={1}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
