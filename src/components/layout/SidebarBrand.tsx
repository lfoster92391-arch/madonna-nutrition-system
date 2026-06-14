"use client"

import Link from "next/link"
import Image from "next/image"

type SidebarBrandProps = {
  href?: string
  portalLabel?: string
}

export function SidebarBrand({ href = "/", portalLabel }: SidebarBrandProps) {
  return (
    <div className="border-b border-silver/30 bg-primary">
      <Link href={href} className="flex flex-col items-center px-4 py-4">
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
