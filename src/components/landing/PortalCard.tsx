import Link from "next/link"
import type { CSSProperties } from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"

export interface PortalCardProps {
  portalName: string
  roleLabel: string
  description: string
  color: string
  route: string
  icon: LucideIcon
  index?: number
}

const MOBILE_TEXT_SHADOW = "0 1px 3px rgba(0, 0, 0, 0.45), 0 0 1px rgba(0, 0, 0, 0.3)"

export function PortalCard({
  portalName,
  roleLabel,
  description,
  color,
  route,
  icon: Icon,
  index = 0,
}: PortalCardProps) {
  return (
    <Link
      href={route}
      className="landing-card-enter group relative flex w-full min-w-0 max-w-full max-md:min-h-[44px] max-md:flex-row max-md:items-stretch max-md:justify-start max-md:gap-3 max-md:rounded-[19px] max-md:border max-md:border-white/30 max-md:px-3 max-md:py-3 max-md:pr-9 max-md:shadow-[0_4px_16px_rgba(0,30,98,0.18)] max-md:backdrop-blur-sm max-md:[background:linear-gradient(145deg,color-mix(in_srgb,var(--portal-color)_96%,#041B52),color-mix(in_srgb,var(--portal-color)_88%,#041B52))] max-md:active:scale-[0.98] md:h-[200px] md:max-w-[240px] md:flex-1 md:basis-[160px] md:flex-col md:items-center md:justify-center md:rounded-[24px] md:px-4 md:py-5 md:[background-color:var(--portal-color)] md:shadow-[0_8px_24px_rgba(0,30,98,0.18)] md:transition-transform md:duration-200 md:hover:-translate-y-[6px] md:hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001E62]"
      style={
        {
          "--portal-color": color,
          animationDelay: `${index * 65}ms`,
        } as CSSProperties
      }
    >
      <span
        className="mb-3 flex h-14 w-14 max-md:mb-0 max-md:mt-0.5 max-md:h-11 max-md:w-11 max-md:shrink-0 items-center justify-center rounded-full md:mb-3"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          boxShadow: "0 0 28px rgba(255, 255, 255, 0.25)",
        }}
        aria-hidden
      >
        <Icon className="h-7 w-7 max-md:h-5 max-md:w-5 shrink-0 text-white" strokeWidth={1.75} />
      </span>

      <div className="max-md:flex max-md:min-w-0 max-md:flex-1 max-md:flex-col max-md:justify-center max-md:rounded-xl max-md:bg-[#041B52]/30 max-md:px-2.5 max-md:py-2 max-md:text-left md:text-center">
        <span
          className="mb-1.5 inline-flex max-w-full rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white max-md:block max-md:truncate md:hidden"
          style={{ textShadow: MOBILE_TEXT_SHADOW }}
        >
          {roleLabel}
        </span>

        <span
          className="block max-w-full text-center text-lg font-bold leading-tight text-white max-md:truncate max-md:text-left max-md:text-[17px] max-md:leading-snug md:text-balance md:text-lg"
          style={{ textShadow: MOBILE_TEXT_SHADOW }}
        >
          {portalName}
        </span>

        <span className="mt-2 h-px w-12 bg-white/40 max-md:hidden" aria-hidden />

        <p
          className="mt-2 text-center text-sm leading-snug text-white max-md:mt-1 max-md:text-left max-md:text-[13px] max-md:font-medium max-md:leading-snug max-md:line-clamp-1 md:mt-2 md:text-center md:text-sm md:font-normal md:text-white/90"
          style={{ textShadow: MOBILE_TEXT_SHADOW }}
        >
          {description}
        </p>
      </div>

      <ChevronRight
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70 max-md:block md:hidden"
        strokeWidth={2.5}
        aria-hidden
      />
    </Link>
  )
}
