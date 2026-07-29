"use client"

import { Lightbulb } from "lucide-react"
import { CookbookPicker } from "@/components/admin/cookbook/CookbookPicker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CALENDAR_THEMES } from "@/data/calendar-themes"
import { BASIC_ELEMENT_CATALOG } from "@/lib/calendar-design/types"
import { isWeekendDate } from "@/lib/calendar"
import type { DesignElementType } from "@/lib/calendar-design/types"
import type { MealTemplate } from "@/lib/types"

interface ElementsPanelProps {
  activeThemeId: string
  pageYear?: number
  pageMonth?: number
  onAddElement: (type: DesignElementType) => void
  onApplyTheme: (themeId: string) => void
  mealTemplates?: MealTemplate[]
  onAddFromCookbook?: (template: MealTemplate, day: number) => void
  cookbookDay?: number
  cookbookDayError?: string | null
  onCookbookDayChange?: (day: number) => void
  className?: string
}

export function ElementsPanel({
  activeThemeId,
  pageYear,
  pageMonth,
  onAddElement,
  onApplyTheme,
  mealTemplates = [],
  onAddFromCookbook,
  cookbookDay = 1,
  cookbookDayError,
  onCookbookDayChange,
  className,
}: ElementsPanelProps) {
  const dayIsWeekend =
    pageYear != null &&
    pageMonth != null &&
    isWeekendDate(new Date(pageYear, pageMonth - 1, cookbookDay))

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-silver bg-white xl:w-72",
        className
      )}
    >
      <div className="border-b border-silver px-4 py-3">
        <h2 className="text-sm font-bold text-primary">Build your calendar</h2>
        <p className="text-xs text-primary/60">Pick a theme, then add a block or meal</p>
      </div>

      <Tabs defaultValue="themes" className="flex flex-1 flex-col overflow-hidden px-3">
        <TabsList className="mt-3 h-11 shrink-0">
          <TabsTrigger value="themes" className="min-h-9 text-xs">
            Themes
          </TabsTrigger>
          <TabsTrigger value="blocks" className="min-h-9 text-xs">
            Blocks
          </TabsTrigger>
          <TabsTrigger value="meals" className="min-h-9 text-xs">
            Meals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="themes" className="mt-3 flex flex-1 flex-col overflow-hidden">
          <p className="mb-2 shrink-0 text-[11px] text-primary/60">
            One click restyles this month&apos;s calendar.
          </p>
          <div className="flex-1 space-y-1.5 overflow-y-auto pb-3">
            {CALENDAR_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => onApplyTheme(theme.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition",
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
        </TabsContent>

        <TabsContent value="blocks" className="mt-3 flex flex-1 flex-col overflow-hidden">
          <p className="mb-2 shrink-0 text-[11px] text-primary/60">
            Click a block to add it below the calendar.
          </p>
          <div className="flex-1 space-y-2 overflow-y-auto pb-3">
            {BASIC_ELEMENT_CATALOG.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => onAddElement(item.type)}
                className="flex w-full items-start gap-3 rounded-xl border border-silver/60 bg-silver/5 px-3 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="text-2xl leading-none">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-primary">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] text-primary/55">{item.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meals" className="mt-3 flex flex-1 flex-col overflow-hidden">
          <div className="mb-3 shrink-0 space-y-2">
            <Label className="text-xs font-semibold text-primary">Add to day (Mon–Fri)</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={cookbookDay}
              onChange={(e) => onCookbookDayChange?.(Number(e.target.value) || 1)}
              className="h-10"
            />
            <p className="text-[11px] text-primary/60">
              Choose a school day (Mon–Fri), then click a saved meal to place it on the calendar.
            </p>
            {(cookbookDayError || dayIsWeekend) && (
              <p className="text-[11px] font-medium text-danger">
                {cookbookDayError ??
                  "Saturday and Sunday are not school lunch days. Pick a weekday."}
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pb-3">
            <CookbookPicker
              templates={mealTemplates}
              compact
              onSelect={(template) => onAddFromCookbook?.(template, cookbookDay)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <footer className="shrink-0 border-t border-silver bg-silver/10 px-4 py-3">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-[11px] leading-relaxed text-primary/70">
            <strong className="text-primary">Tip:</strong> Start with a theme. Click the calendar
            background to clear a selection.
          </p>
        </div>
      </footer>
    </aside>
  )
}
