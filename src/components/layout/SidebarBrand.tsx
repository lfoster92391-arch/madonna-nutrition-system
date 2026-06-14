"use client"

import Link from "next/link"
import Image from "next/image"

type SidebarBrandProps = {
  href?: string
  portalLabel?: string
}

export function SidebarBrand({ href = "/", portalLabel }: SidebarBrandProps) {
  return (
    <div className="border-b border-[#C8CDD7] bg-[#001E62] px-4 pb-5 pt-6">
      <Link href={href} className="flex flex-col items-center gap-3">
        <div className="w-full overflow-hidden rounded-lg border-2 border-[#C8CDD7] bg-[#001E62]">
          <Image
            src="/sidebar-logo.png"
            alt="Fuel the Dons"
            width={512}
            height={512}
            priority
            className="h-auto min-h-[140px] w-full scale-[1.06] object-contain"
          />
        </div>
        <p className="text-center text-[11px] font-medium uppercase tracking-wide text-silver">
          Nutrition System
        </p>
      </Link>
      {portalLabel ? (
        <p className="mt-3 text-center text-xs font-medium uppercase tracking-wider text-silver/80">
          {portalLabel}
        </p>
      ) : null}
    </div>
  )
}
