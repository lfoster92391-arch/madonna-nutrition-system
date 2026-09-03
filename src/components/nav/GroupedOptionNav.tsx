"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { madonnaOptionBtn } from "@/components/nav/madonna-option-classes"
import type { PortalNavCategory, PortalNavItem } from "@/components/nav/nav-types"
import { cn } from "@/lib/utils"

export type GroupedOptionNavProps = {
  categories: PortalNavCategory[]
  heading?: string
  /** Resolve action keys (drawers / scroll) without inventing routes. */
  onAction?: (action: string) => void
  /** compact = denser grid of category buttons (dashboards); stack = full-width list. */
  layout?: "stack" | "grid"
  className?: string
}

function ItemButton({
  item,
  index,
  onAction,
}: {
  item: PortalNavItem
  index: number
  onAction?: (action: string) => void
}) {
  const className = cn(
    madonnaOptionBtn({ shape: "rounded" }),
    "landing-card-enter flex w-full min-h-12 items-center justify-center px-4 py-3 text-center sm:min-h-14 sm:px-5"
  )
  const style = { animationDelay: `${index * 40}ms` } as const
  const label = (
    <span className="text-sm font-bold tracking-tight sm:text-base">{item.label}</span>
  )

  if (item.href) {
    if (item.external) {
      const isMailto = item.href.startsWith("mailto:")
      return (
        <a
          href={item.href}
          className={className}
          style={style}
          {...(isMailto ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          {label}
        </a>
      )
    }
    return (
      <Link href={item.href} className={className} style={style}>
        {label}
      </Link>
    )
  }

  if (item.action && onAction) {
    return (
      <button
        type="button"
        onClick={() => onAction(item.action!)}
        className={className}
        style={style}
      >
        {label}
      </button>
    )
  }

  return null
}

/**
 * Category buttons → drill into destinations (Admin home pattern).
 * Labels only — no long subheads under choices.
 */
export function GroupedOptionNav({
  categories,
  heading = "Quick access",
  onAction,
  layout = "stack",
  className,
}: GroupedOptionNavProps) {
  const reactId = useId()
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeCategory = categories.find((c) => c.id === activeId) ?? null

  return (
    <section className={cn("space-y-4", className)} aria-label={heading}>
      <h2 className="text-lg font-bold text-[#041B52] md:text-xl">{heading}</h2>

      {activeCategory ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveId(null)}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#041B52] underline-offset-2 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All categories
          </button>
          <h3
            id={`${reactId}-subnav`}
            className="text-base font-bold text-[#041B52] sm:text-lg"
          >
            {activeCategory.label}
          </h3>
          <div className="flex flex-col gap-3" role="list" aria-labelledby={`${reactId}-subnav`}>
            {activeCategory.items.map((item, index) => (
              <div key={`${activeCategory.id}-${item.label}`} role="listitem">
                <ItemButton item={item} index={index} onAction={onAction} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            layout === "grid"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
              : "flex flex-col gap-3"
          )}
          role="list"
        >
          {categories.map((category, index) => (
            <div key={category.id} role="listitem">
              <button
                type="button"
                onClick={() => setActiveId(category.id)}
                className={cn(
                  madonnaOptionBtn({ shape: "rounded" }),
                  "landing-card-enter flex w-full min-h-12 items-center justify-between gap-3 px-4 py-3 text-left sm:min-h-14 sm:px-5"
                )}
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <span className="text-sm font-bold tracking-tight sm:text-base">
                  {category.label}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-white/85" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
