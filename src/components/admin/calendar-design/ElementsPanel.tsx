"use client"

import { useMemo, useState } from "react"
import { ImageIcon, Lightbulb, Search } from "lucide-react"
import { CookbookPicker } from "@/components/admin/cookbook/CookbookPicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CALENDAR_THEMES } from "@/data/calendar-themes"
import { ELEMENT_CATALOG } from "@/lib/calendar-design/types"
import type { DesignElementType } from "@/lib/calendar-design/types"
import type { MealTemplate } from "@/lib/types"

interface ElementsPanelProps {
  activeThemeId: string
  onAddElement: (type: DesignElementType) => void
  onApplyTheme: (themeId: string) => void
  mealTemplates?: MealTemplate[]
  onAddFromCookbook?: (template: MealTemplate, day: number) => void
  cookbookDay?: number
  onCookbookDayChange?: (day: number) => void
  className?: string
}

const MEDIA_LIBRARY = [
  { id: "ml-1", name: "Heart Border", emoji: "💕" },
  { id: "ml-2", name: "Lunch Tray", emoji: "🍽️" },
  { id: "ml-3", name: "School Logo", emoji: "🏫" },
  { id: "ml-4", name: "Nutrition Badge", emoji: "🥗" },
  { id: "ml-5", name: "Valentine Banner", emoji: "🎀" },
  { id: "ml-6", name: "Staff Photo Frame", emoji: "📸" },
]

export function ElementsPanel({
  activeThemeId,
  onAddElement,
  onApplyTheme,
  mealTemplates = [],
  onAddFromCookbook,
  cookbookDay = 1,
  onCookbookDayChange,
  className,
}: ElementsPanelProps) {
  const [search, setSearch] = useState("")

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ELEMENT_CATALOG
    return ELEMENT_CATALOG.filter(
      (el) => el.label.toLowerCase().includes(q) || el.type.includes(q)
    )
  }, [search])

  return (
    <aside className={cn("flex h-full w-72 shrink-0 flex-col border-r border-silver bg-white", className)}>
      <div className="border-b border-silver px-4 py-3">
        <h2 className="text-sm font-bold text-primary">Add Elements</h2>
        <p className="text-xs text-primary/60">Drag or click to add to canvas</p>
      </div>

      <Tabs defaultValue="elements" className="flex flex-1 flex-col overflow-hidden px-3">
        <TabsList className="mt-3 h-11 shrink-0">
          <TabsTrigger value="elements" className="min-h-9 text-xs">
            Elements
          </TabsTrigger>
          <TabsTrigger value="cookbook" className="min-h-9 text-xs">
            Cookbook
          </TabsTrigger>
          <TabsTrigger value="assets" className="min-h-9 text-xs">
            My Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elements" className="mt-3 flex flex-1 flex-col overflow-hidden">
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
            <Input
              placeholder="Search elements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto pb-3">
            <div className="grid grid-cols-2 gap-2">
              {filteredCatalog.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onAddElement(item.type)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-silver/60 bg-silver/5 px-2 py-3 text-center transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] font-semibold leading-tight text-primary">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary/50">
                Theme Packs
              </p>
              <div className="space-y-1.5">
                {CALENDAR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onApplyTheme(theme.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                      activeThemeId === theme.id
                        ? "border-primary bg-primary/5 font-semibold text-primary"
                        : "border-silver/60 hover:border-primary/30 hover:bg-silver/10"
                    )}
                  >
                    <span className="text-lg">{theme.emoji}</span>
                    <span className="flex-1 truncate">{theme.name}</span>
                    {activeThemeId === theme.id && (
                      <span className="text-[10px] font-bold text-success">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cookbook" className="mt-3 flex flex-1 flex-col overflow-hidden">
          <div className="mb-3 shrink-0 space-y-2">
            <Label className="text-xs font-semibold text-primary">Insert on calendar day</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={cookbookDay}
              onChange={(e) => onCookbookDayChange?.(Number(e.target.value) || 1)}
              className="h-10"
            />
            <p className="text-[11px] text-primary/60">
              Click a saved meal to add a meal card and schedule it on the selected day.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto pb-3">
            <CookbookPicker
              templates={mealTemplates}
              compact
              onSelect={(template) => onAddFromCookbook?.(template, cookbookDay)}
            />
          </div>
        </TabsContent>

        <TabsContent value="assets" className="mt-3 flex flex-1 flex-col overflow-hidden">
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
            <Input placeholder="Search assets..." className="h-10 pl-9 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto pb-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary/50">
              Media Library
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MEDIA_LIBRARY.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className="flex flex-col items-center gap-1 rounded-xl border border-silver/60 bg-silver/5 px-2 py-3 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-2xl">{asset.emoji}</span>
                  <span className="text-[10px] font-semibold text-primary">{asset.name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-silver/80 py-4 text-xs font-semibold text-primary/60 transition hover:border-primary/40 hover:text-primary"
            >
              <ImageIcon className="h-4 w-4" />
              Upload Asset
            </button>
          </div>
        </TabsContent>
      </Tabs>

      <footer className="shrink-0 border-t border-silver bg-silver/10 px-4 py-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-[11px] leading-relaxed text-primary/70">
            <strong className="text-primary">Tip:</strong> Click any element to add it to your
            calendar. Use theme packs to instantly restyle the whole page.
          </p>
        </div>
      </footer>
    </aside>
  )
}
