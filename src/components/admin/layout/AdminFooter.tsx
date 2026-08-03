"use client"

import Image from "next/image"
import { BRAND } from "@/config/brand"
import { ADMIN_NAVY, ADMIN_SILVER } from "@/components/admin/layout/admin-theme"

export function AdminFooter() {
  return (
    <footer
      className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-4 md:px-8"
      style={{ backgroundColor: ADMIN_NAVY, borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div>
        <p className="text-sm font-semibold text-white">{BRAND.productName}</p>
        <p className="mt-0.5 text-xs" style={{ color: ADMIN_SILVER }}>
          {BRAND.tagline}
        </p>
      </div>
      <Image
        src="/brand-logo.png"
        alt="Fuel The Dons"
        width={120}
        height={32}
        className="h-8 w-auto object-contain opacity-90"
      />
    </footer>
  )
}
