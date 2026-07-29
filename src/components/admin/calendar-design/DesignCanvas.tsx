"use client"

import { useMemo } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getThemeById } from "@/data/calendar-themes"
import { getFactsForTheme } from "@/data/daily-bite-facts"
import { DEMO_CALENDAR_DAYS } from "@/lib/calendar-design/defaults"
import { CORE_ELEMENT_TYPES, VIEWPORT_WIDTHS } from "@/lib/calendar-design/types"
import type { DesignElement, DesignPage, ViewportMode } from "@/lib/calendar-design/types"

interface DesignCanvasProps {
  page: DesignPage
  zoom: number
  viewport: ViewportMode
  showGrid: boolean
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onRemoveElement?: (id: string) => void
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getLabelColor(
  label: string,
  colors: ReturnType<typeof getThemeById>["colors"]
): string {
  switch (label) {
    case "special":
      return colors.labelSpecial
    case "teacher":
      return colors.labelTeacher
    case "no_school":
      return colors.labelNoSchool
    default:
      return colors.labelLunch
  }
}

function buildMonthGrid(year: number, month: number) {
  const monthIndex = month - 1
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function blockPreviewLabel(el: DesignElement): string {
  if (el.mealRef?.name) return el.mealRef.name
  if (el.content?.trim()) return el.content.trim()
  return el.label
}

export function DesignCanvas({
  page,
  zoom,
  viewport,
  showGrid,
  selectedElementId,
  onSelectElement,
  onRemoveElement,
}: DesignCanvasProps) {
  const theme = getThemeById(page.themeId)
  const fact = getFactsForTheme(page.themeId)[0]
  const staffPick = page.elements.find((el) => el.type === "staff_pick")?.staffPick
  const gridCells = useMemo(
    () => buildMonthGrid(page.year, page.month),
    [page.year, page.month]
  )

  const dayMap = useMemo(() => {
    const map = new Map<number, (typeof DEMO_CALENDAR_DAYS)[number]>()
    for (const day of DEMO_CALENDAR_DAYS) map.set(day.day, day)
    return map
  }, [])

  /** Extra blocks sit in normal document flow below the calendar — never as absolute overlays. */
  const extraElements = useMemo(() => {
    const seenCore = new Set<string>()
    return page.elements.filter((el) => {
      if (CORE_ELEMENT_TYPES.includes(el.type)) {
        if (seenCore.has(el.type)) return true
        seenCore.add(el.type)
        return false
      }
      return true
    })
  }, [page.elements])

  const canvasWidth = VIEWPORT_WIDTHS[viewport]

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-silver/20">
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto overscroll-contain p-2 sm:p-3 lg:p-4 xl:p-6">
        <div
          className="relative origin-top transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            width: canvasWidth,
            maxWidth: "100%",
            marginBottom: zoom < 1 ? undefined : `${Math.max(0, (zoom - 1) * 40)}px`,
          }}
        >
          <div
            role="presentation"
            className={cn(
              "relative overflow-hidden rounded-[20px] border-2 shadow-xl",
              showGrid && "bg-grid-pattern"
            )}
            style={{
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            }}
            onClick={() => onSelectElement(null)}
          >
            {showGrid && (
              <div
                className="pointer-events-none absolute inset-0 z-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #041B52 1px, transparent 1px), linear-gradient(to bottom, #041B52 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            )}

            <div
              className="relative z-[1] px-4 py-4 text-center sm:px-6 sm:py-5"
              style={{ background: theme.colors.headerBg, color: theme.colors.headerText }}
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-3 text-xl opacity-40 sm:px-4 sm:text-2xl">
                {theme.decorations.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <p className="relative text-[10px] font-bold uppercase tracking-[0.25em] opacity-90 sm:text-xs">
                Madonna Nutrition Services
              </p>
              <h1 className="relative mt-1 text-xl font-bold sm:text-2xl">{page.title}</h1>
              <p className="relative mt-1 text-xs opacity-90 sm:text-sm">
                {theme.emoji} {theme.name} Theme
              </p>
            </div>

            <div className="relative z-[1] p-3 sm:p-4">
              <div
                className="mb-4 overflow-hidden rounded-2xl border"
                style={{ borderColor: theme.colors.border }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectElement("el-calendar-grid")
                }}
              >
                <div
                  className={cn(
                    "grid grid-cols-7 border-b text-center text-[10px] font-bold uppercase tracking-wide sm:text-xs",
                    selectedElementId === "el-calendar-grid" && "ring-2 ring-inset ring-primary"
                  )}
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text,
                  }}
                >
                  {WEEKDAYS.map((wd) => (
                    <div key={wd} className="py-2">
                      {wd}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {gridCells.map((dayNum, idx) => {
                    const dayData = dayNum ? dayMap.get(dayNum) : undefined
                    const meal = dayData?.meals[0]
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[56px] border-b border-r p-1 text-[10px] sm:min-h-[72px] sm:p-1.5 sm:text-xs",
                          !dayNum && "bg-silver/10"
                        )}
                        style={{
                          borderColor: `${theme.colors.border}40`,
                          color: theme.colors.text,
                        }}
                      >
                        {dayNum && (
                          <>
                            <span className="font-bold">{dayNum}</span>
                            {meal && (
                              <div
                                className="mt-1 rounded-md px-1 py-0.5 text-[8px] font-semibold leading-tight text-white sm:text-[9px]"
                                style={{
                                  backgroundColor: getLabelColor(meal.label, theme.colors),
                                }}
                              >
                                {meal.name}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectElement("el-did-you-know")
                  }}
                  className={cn(
                    "rounded-2xl border-2 p-3 text-left transition sm:p-4",
                    selectedElementId === "el-did-you-know" && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{
                    backgroundColor: theme.colors.secondary,
                    borderColor: theme.colors.primary,
                    color: theme.colors.text,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    💡 Did You Know?
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {fact.emoji} {fact.text}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectElement("el-staff-pick")
                  }}
                  className={cn(
                    "rounded-2xl border-2 p-3 text-left transition sm:p-4",
                    selectedElementId === "el-staff-pick" && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.accent,
                    color: "#FFFFFF",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                    👩‍🏫 {staffPick?.title ?? "Staff Pick of the Week"}
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {staffPick?.mealName ?? "Buffalo Chicken Wrap"}
                  </p>
                  <p className="mt-1 text-xs opacity-90">
                    {staffPick?.subtitle ?? "This week's favorite from our team"}
                  </p>
                  <p className="mt-2 text-xs font-semibold opacity-80">
                    — {staffPick?.staffName ?? "Mrs. Miller"}
                  </p>
                </button>
              </div>

              {extraElements.length > 0 ? (
                <div className="relative z-[1] mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: theme.colors.text }}
                  >
                    Added blocks
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {extraElements.map((el) => {
                      const selected = selectedElementId === el.id
                      return (
                        <div
                          key={el.id}
                          className={cn(
                            "relative rounded-xl border-2 p-3 text-left transition",
                            selected && "ring-2 ring-primary ring-offset-2"
                          )}
                          style={{
                            backgroundColor: el.appearance.backgroundColor || theme.colors.secondary,
                            borderColor: selected
                              ? theme.colors.accent
                              : el.appearance.borderColor || theme.colors.border,
                            color: el.appearance.textColor || theme.colors.text,
                          }}
                        >
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => onSelectElement(selected ? null : el.id)}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                              {el.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-snug">
                              {blockPreviewLabel(el)}
                            </p>
                          </button>
                          {onRemoveElement ? (
                            <button
                              type="button"
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-primary/70 transition hover:bg-white hover:text-primary"
                              title="Remove block"
                              aria-label={`Remove ${el.label}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveElement(el.id)
                                if (selected) onSelectElement(null)
                              }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
