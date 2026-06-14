"use client"

import Link from "next/link"
import Image from "next/image"

type SidebarBrandProps = {
  href?: string
  portalLabel?: string
}

export function SidebarBrand({ href = "/", portalLabel }: SidebarBrandProps) {
  return (
    <div className="border-b-2 border-[#C8CDD7] bg-[#001E62] p-3">
      <Link href={href} className="flex flex-col items-center gap-3">
        <Image
          src="/sidebar-logo.png"
          alt="Fuel the Dons"
          width={512}
          height={512}
          priority
          className="mx-auto w-full max-w-[220px] rounded-lg border-2 border-[#C8CDD7] object-contain shadow-none"
        />
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
