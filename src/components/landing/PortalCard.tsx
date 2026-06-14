import Link from "next/link"
import type { LucideIcon } from "lucide-react"

export interface PortalCardProps {
  portalName: string
  description: string
  color: string
  route: string
  icon: LucideIcon
}

export function PortalCard({
  portalName,
  description,
  color,
  route,
  icon: Icon,
}: PortalCardProps) {
  return (
    <Link
      href={route}
      className="group flex h-[280px] w-[320px] max-w-full flex-col items-center rounded-[24px] px-6 py-8 text-white shadow-[0_8px_24px_rgba(0,30,98,0.18)] transition-transform duration-200 hover:-translate-y-[6px] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001E62]"
      style={{ backgroundColor: color }}
    >
      <span
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          boxShadow: "0 0 28px rgba(255, 255, 255, 0.25)",
        }}
        aria-hidden
      >
        <Icon className="h-8 w-8 shrink-0" strokeWidth={1.5} />
      </span>
      <span className="text-center text-lg font-bold leading-tight">{portalName}</span>
      <span className="mt-3 h-px w-12 bg-white/40" aria-hidden />
      <p className="mt-3 text-center text-sm leading-snug text-white/90">{description}</p>
    </Link>
  )
}
