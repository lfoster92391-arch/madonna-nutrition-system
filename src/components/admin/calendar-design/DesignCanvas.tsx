"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { getThemeById } from "@/data/calendar-themes"
import { getFactsForTheme } from "@/data/daily-bite-facts"
import { DEMO_CALENDAR_DAYS } from "@/lib/calendar-design/defaults"
import { VIEWPORT_WIDTHS } from "@/lib/calendar-design/types"
import type { DesignElement, DesignPage, ViewportMode } from "@/lib/calendar-design/types"

interface DesignCanvasProps {
  page: DesignPage
  zoom: number
  viewport: ViewportMode
  showGrid: boolean
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
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

function buildFebruaryGrid(year: number) {
  const firstDay = new Date(year, 1, 1).getDay()
  const daysInMonth = new Date(year, 2, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function DesignCanvas({
  page,
  zoom,
  viewport,
  showGrid,
  selectedElementId,
  onSelectElement,
}: DesignCanvasProps) {
  const theme = getThemeById(page.themeId)
  const fact = getFactsForTheme(page.themeId)[0]
  const staffPick = page.elements.find((el) => el.type === "staff_pick")?.staffPick
  const gridCells = useMemo(() => buildFebruaryGrid(page.year), [page.year])

  const dayMap = useMemo(() => {
    const map = new Map<number, (typeof DEMO_CALENDAR_DAYS)[number]>()
    for (const day of DEMO_CALENDAR_DAYS) map.set(day.day, day)
    return map
  }, [])

  const canvasWidth = VIEWPORT_WIDTHS[viewport]

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-silver/20">
      <div className="flex flex-1 items-start justify-center overflow-auto p-2 sm:p-4 lg:p-6">
        <div
          className="relative origin-top transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, width: canvasWidth, maxWidth: "100%" }}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-[20px] border-2 shadow-xl",
              showGrid && "bg-grid-pattern"
            )}
            style={{
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            }}
          >
            {showGrid && (
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #041B52 1px, transparent 1px), linear-gradient(to bottom, #041B52 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
            )}

            {/* Theme header */}
            <div
              className="relative px-6 py-5 text-center"
              style={{ background: theme.colors.headerBg, color: theme.colors.headerText }}
            >
              <div className="absolute inset-0 flex items-center justify-between px-4 text-2xl opacity-40">
                {theme.decorations.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <p className="relative text-xs font-bold uppercase tracking-[0.25em] opacity-90">
                Madonna Nutrition Services
              </p>
              <h1 className="relative mt-1 text-2xl font-bold">{page.title}</h1>
              <p className="relative mt-1 text-sm opacity-90">
                {theme.emoji} {theme.name} Theme
              </p>
            </div>

            <div className="p-4">
              {/* Calendar grid */}
              <div
                className="mb-4 overflow-hidden rounded-2xl border"
                style={{ borderColor: theme.colors.border }}
              >
                <div
                  className="grid grid-cols-7 border-b text-center text-xs font-bold uppercase tracking-wide"
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
                          "min-h-[72px] border-b border-r p-1.5 text-xs",
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
                                className="mt-1 rounded-md px-1 py-0.5 text-[9px] font-semibold leading-tight text-white"
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

              {/* Bottom widgets row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Did You Know */}
                <button
                  type="button"
                  onClick={() => onSelectElement("el-did-you-know")}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-left transition",
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

                {/* Staff Pick */}
                <button
                  type="button"
                  onClick={() => onSelectElement("el-staff-pick")}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-left transition",
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
                  <p className="mt-1 text-lg font-bold">{staffPick?.mealName ?? "Buffalo Chicken Wrap"}</p>
                  <p className="mt-1 text-xs opacity-90">
                    {staffPick?.subtitle ?? "This week's favorite from our team"}
                  </p>
                  <p className="mt-2 text-xs font-semibold opacity-80">
                    — {staffPick?.staffName ?? "Mrs. Miller"}
                  </p>
                </button>
              </div>

              {/* Rendered design elements overlay labels */}
              {page.elements
                .filter((el) => !["calendar_grid", "did_you_know", "staff_pick"].includes(el.type))
                .map((el) => (
                  <ElementOverlay
                    key={el.id}
                    element={el}
                    selected={selectedElementId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    themeText={theme.colors.text}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ElementOverlay({
  element,
  selected,
  onSelect,
  themeText,
}: {
  element: DesignElement
  selected: boolean
  onSelect: () => void
  themeText: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "absolute rounded-xl border-2 border-dashed px-3 py-2 text-xs font-semibold transition",
        selected ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-primary/30 bg-white/80"
      )}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        color: themeText,
      }}
    >
      {element.mealRef?.name ?? element.label}
    </button>
  )
}
