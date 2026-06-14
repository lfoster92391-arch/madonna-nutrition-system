"use client"

import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

type SidebarBrandProps = {
  href?: string
  portalLabel?: string
  compact?: boolean
  collapsed?: boolean
}

export function SidebarBrand({
  href = "/",
  portalLabel,
  compact = false,
  collapsed = false,
}: SidebarBrandProps) {
  if (collapsed) {
    return (
      <div className="border-b border-silver/30 bg-primary">
        <Link
          href={href}
          className="flex items-center justify-center px-2 py-3"
          title={portalLabel}
        >
          <Image
            src="/dons-crest.svg"
            alt="Fuel the Dons"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain opacity-95"
          />
        </Link>
      </div>
    )
  }

  return (
    <div className="border-b border-silver/30 bg-primary">
      <Link
        href={href}
        className={cn("flex flex-col items-center", compact ? "px-3 py-3" : "px-4 py-4")}
      >
        <Image
          src="/brand-logo.png"
          alt="Fuel the Dons"
          width={960}
          height={240}
          priority
          className="h-auto w-full object-contain opacity-95"
        />
        <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-silver">
          Operations Platform
        </p>
        {portalLabel ? (
          <p className="mt-1 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-white/70">
            {portalLabel}
          </p>
        ) : null}
      </Link>
    </div>
  )
}
