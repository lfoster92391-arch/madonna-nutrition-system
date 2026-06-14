"use client"

import Link from "next/link"
import Image from "next/image"

type SidebarBrandProps = {
  href?: string
  portalLabel?: string
}

export function SidebarBrand({ href = "/", portalLabel }: SidebarBrandProps) {
  return (
    <div className="border-b border-silver px-6 pb-5 pt-6">
      <Link href={href} className="flex flex-col items-center gap-3">
        <Image
          src="/icon.png"
          alt="Fuel the Dons"
          width={80}
          height={80}
          priority
          className="h-20 w-20 object-contain"
        />
        <div className="text-center">
          <p className="text-base font-bold italic text-white">Fuel the Dons</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-silver">
            Nutrition System
          </p>
        </div>
      </Link>
      {portalLabel ? (
        <p className="mt-4 text-center text-xs font-medium uppercase tracking-wider text-silver/80">
          {portalLabel}
        </p>
      ) : null}
    </div>
  )
}
