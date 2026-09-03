"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, ScanLine } from "lucide-react"
import { madonnaOptionBtn } from "@/components/nav/madonna-option-classes"
import type { PortalNavCategory } from "@/components/nav/nav-types"
import { cn } from "@/lib/utils"

export type GroupedNavDropdownBarProps = {
  categories: PortalNavCategory[]
  /** Extra direct actions (e.g. Cashier / POS) kept outside groups. */
  directLinks?: { label: string; href: string; icon?: "scan" }[]
  "aria-label"?: string
}

/**
 * Horizontal top-bar: category triggers open dropdown panels of destinations.
 * Mobile-friendly horizontal scroll; closes on outside click / Escape / navigate.
 */
export function GroupedNavDropdownBar({
  categories,
  directLinks = [],
  "aria-label": ariaLabel = "Quick navigation",
}: GroupedNavDropdownBarProps) {
  const reactId = useId()
  const rootRef = useRef<HTMLElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const close = useCallback(() => setOpenId(null), [])

  useEffect(() => {
    if (!openId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onPointer)
    }
  }, [openId, close])

  return (
    <nav
      ref={rootRef}
      aria-label={ariaLabel}
      className="relative shrink-0 border-b shadow-sm"
      style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "#041B52" }}
    >
      <div className="mobile-scroll-x flex items-center gap-2 px-2 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3 md:px-6 lg:px-8">
        {categories.map((category) => {
          const isOpen = openId === category.id
          const panelId = `${reactId}-${category.id}-panel`
          const triggerLabel = category.shortLabel ?? category.label

          return (
            <div key={category.id} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : category.id)}
                className={cn(
                  madonnaOptionBtn({ active: isOpen, shape: "rounded" }),
                  "flex min-h-10 items-center gap-1.5 px-3 py-2 text-xs font-bold sm:min-h-11 sm:gap-2 sm:px-3.5 sm:text-sm"
                )}
              >
                <span className="whitespace-nowrap">{triggerLabel}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-white/85 transition-transform sm:h-4 sm:w-4",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {isOpen ? (
                <div
                  id={panelId}
                  role="menu"
                  className="absolute left-0 top-full z-40 mt-1.5 min-w-[12.5rem] max-w-[min(18rem,85vw)] rounded-xl border border-white/15 bg-[#041B52] p-1.5 shadow-xl"
                >
                  {category.items.map((item) =>
                    item.href ? (
                      <Link
                        key={`${category.id}-${item.label}`}
                        href={item.href}
                        role="menuitem"
                        onClick={close}
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ) : null
                  )}
                </div>
              ) : null}
            </div>
          )
        })}

        {directLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              madonnaOptionBtn({ shape: "rounded" }),
              "flex min-h-10 shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-bold sm:min-h-11 sm:gap-2 sm:px-3.5 sm:text-sm"
            )}
          >
            {link.icon === "scan" ? (
              <ScanLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            ) : null}
            <span className="whitespace-nowrap">{link.label}</span>
          </Link>
        ))}
      </div>
      <div className="h-0.5 bg-white/15" />
    </nav>
  )
}
