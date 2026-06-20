"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search, UtensilsCrossed } from "lucide-react"
import { Input } from "@/components/ui/input"
import { COOKBOOK_TABS, formatCategoryLabel, getMealCoverPhoto } from "@/lib/meal-templates"
import type { MealCategory, MealTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CookbookPickerProps {
  templates: MealTemplate[]
  onSelect: (template: MealTemplate) => void
  /** When set, only show reusable templates */
  reusableOnly?: boolean
  compact?: boolean
  className?: string
}

export function CookbookPicker({
  templates,
  onSelect,
  reusableOnly = true,
  compact = false,
  className,
}: CookbookPickerProps) {
  const [activeTab, setActiveTab] = useState<MealCategory>("lunch")
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return templates.filter((t) => {
      if (t.isArchived) return false
      if (reusableOnly && t.isReusable === false) return false
      if (t.category !== activeTab) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.items.some((i) => i.name.toLowerCase().includes(q))
      )
    })
  }, [templates, activeTab, search, reusableOnly])

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap gap-2">
        {COOKBOOK_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              activeTab === tab.id
                ? "bg-primary text-white"
                : "border border-silver/60 bg-white text-primary hover:border-primary/30"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cookbook..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-silver-foreground">
          No saved meals in {formatCategoryLabel(activeTab)} yet.
        </p>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
          )}
        >
          {filtered.map((template) => {
            const cover = getMealCoverPhoto(template.photos)
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template)}
                className="group overflow-hidden rounded-2xl border border-silver/60 bg-white text-left transition hover:border-success hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-silver/20">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={template.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 200px"
                      unoptimized={cover.startsWith("/uploads/") || cover.startsWith("blob:")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-silver-foreground">
                      <UtensilsCrossed className="h-8 w-8 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate font-semibold text-primary">{template.name}</p>
                  {template.studentMealPrice != null && (
                    <p className="mt-0.5 text-xs text-silver-foreground">
                      ${template.studentMealPrice.toFixed(2)}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
