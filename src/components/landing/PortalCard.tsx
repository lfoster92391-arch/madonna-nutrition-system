import Link from "next/link"
import type { CSSProperties } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"

export interface PortalCardProps {
  portalName: string
  description: string
  color: string
  route: string
  icon: LucideIcon
  index?: number
}

export function PortalCard({
  portalName,
  description,
  color,
  route,
  icon: Icon,
  index = 0,
}: PortalCardProps) {
  return (
    <Link
      href={route}
      className="landing-card-enter group relative flex w-full max-md:min-h-[44px] max-md:h-[140px] max-md:flex-row max-md:items-center max-md:justify-start max-md:rounded-[19px] max-md:border max-md:border-white/20 max-md:px-3.5 max-md:py-3 max-md:shadow-[0_4px_16px_rgba(0,30,98,0.12)] max-md:backdrop-blur-md max-md:[background:linear-gradient(145deg,color-mix(in_srgb,var(--portal-color)_92%,transparent),color-mix(in_srgb,var(--portal-color)_76%,transparent))] max-md:active:scale-[0.98] md:h-[200px] md:max-w-[360px] md:shrink-0 md:flex-col md:items-center md:justify-center md:rounded-[24px] md:px-6 md:py-5 md:[background-color:var(--portal-color)] md:shadow-[0_8px_24px_rgba(0,30,98,0.18)] md:transition-transform md:duration-200 md:hover:-translate-y-[6px] md:hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001E62] sm:w-[360px]"
      style={
        {
          "--portal-color": color,
          animationDelay: `${index * 65}ms`,
        } as CSSProperties
      }
    >
      <span
        className="mb-3 flex h-14 w-14 max-md:mb-0 max-md:h-12 max-md:w-12 max-md:shrink-0 items-center justify-center rounded-full md:mb-3"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          boxShadow: "0 0 28px rgba(255, 255, 255, 0.25)",
        }}
        aria-hidden
      >
        <Icon className="h-7 w-7 max-md:h-6 max-md:w-6 shrink-0" strokeWidth={1.5} />
      </span>

      <div className="max-md:flex-1 max-md:px-2 max-md:text-left md:text-center">
        <span className="text-center text-lg font-bold leading-tight max-md:text-left max-md:text-[22px] md:text-lg">
          {portalName}
        </span>
        <span className="mt-2 h-px w-12 bg-white/40 max-md:hidden" aria-hidden />
        <p className="mt-2 text-center text-sm leading-snug text-white/90 max-md:mt-1 max-md:text-left max-md:text-[15px] max-md:font-medium max-md:leading-snug max-md:line-clamp-2 md:mt-2 md:text-center md:text-sm md:font-normal">
          {description}
        </p>
      </div>

      <ChevronRight
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 max-md:block md:hidden"
        strokeWidth={2}
        aria-hidden
      />
    </Link>
  )
}
