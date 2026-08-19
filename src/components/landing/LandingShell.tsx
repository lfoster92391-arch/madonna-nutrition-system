import type { ReactNode } from "react"
import { SupportNeedHelp } from "@/components/support/SupportNeedHelp"
import { cn } from "@/lib/utils"

/** Shared Fuel The Dons landing chrome (background + safe-area framing). */
export function LandingShell({
  children,
  /** Use `start` for long scroll guides (e.g. Parent Orientation). */
  align = "end",
  /** Wider content column for dense sections (e.g. orientation dashboard previews). */
  contentMaxClassName = "max-w-[920px]",
}: {
  children: ReactNode
  align?: "end" | "start"
  contentMaxClassName?: string
}) {
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
      <main
        className={cn(
          "relative z-10 flex min-h-screen min-h-[100dvh] w-full max-w-[100vw] flex-col items-center px-4 sm:px-6",
          align === "start"
            ? "justify-start pb-[max(env(safe-area-inset-bottom),2rem)] pt-[max(env(safe-area-inset-top),1.25rem)] sm:pb-12 sm:pt-10"
            : "justify-end pb-[8vh] max-md:justify-start max-md:pb-[max(env(safe-area-inset-bottom),1.25rem)] max-md:pt-[max(env(safe-area-inset-top),1rem)] sm:pb-[10vh] lg:pb-[12vh]"
        )}
      >
        <div className={cn("flex w-full min-w-0 flex-col items-center text-center", contentMaxClassName)}>
          {children}
          <SupportNeedHelp
            className="mt-6 text-sm font-medium text-[#475569]"
            linkStyle={{ color: "#041B52" }}
          />
        </div>
      </main>
    </div>
  )
}
