"use client"

import Image from "next/image"
import { LogOut } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { V3_NAVY, V3_SILVER } from "@/components/parent/v3/parent-v3-theme"

export function ParentV3Header() {
  const { logout } = useAuth()

  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-white px-6 md:px-8"
      style={{ borderColor: V3_SILVER }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/dons-crest.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
            aria-hidden
          />
          <span className="truncate text-sm font-bold" style={{ color: V3_NAVY }}>
            Fuel The Dons
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            logout()
            window.location.href = "/"
          }}
          className="flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-[12px] px-3 text-sm font-medium text-[#64748B] transition hover:bg-[#041B52]/5"
          style={{ color: V3_NAVY }}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
