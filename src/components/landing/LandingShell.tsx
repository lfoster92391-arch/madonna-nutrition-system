import type { ReactNode } from "react"

/** Shared Fuel The Dons landing chrome (background + safe-area framing). */
export function LandingShell({ children }: { children: ReactNode }) {
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
          {children}
        </div>
      </main>
    </div>
  )
}
