const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")

function write(rel, content) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content.replace(/\r?\n/g, "\n"), "utf8")
  console.log("wrote", rel)
}

write(
  "src/components/admin/calendar-design/DesignToolbar.tsx",
  `"use client"

import {
  Download,
  Eye,
  Grid3X3,
  History,
  Layers,
  Magnet,
  Monitor,
  Printer,
  Redo2,
  Save,
  Smartphone,
  Tablet,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ViewportMode } from "@/lib/calendar-design/types"

interface DesignToolbarProps {
  zoom: number
  viewport: ViewportMode
  showGrid: boolean
  snapToGrid: boolean
  showLayers: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onViewportChange: (mode: ViewportMode) => void
  onToggleGrid: () => void
  onToggleSnap: () => void
  onToggleLayers: () => void
  onVersionHistory: () => void
  onExport: () => void
  onSave: () => void
  onPreview: () => void
  onPublish: () => void
}

const VIEWPORTS: { mode: ViewportMode; label: string; icon: typeof Monitor }[] = [
  { mode: "desktop", label: "Desktop", icon: Monitor },
  { mode: "tablet", label: "Tablet", icon: Tablet },
  { mode: "mobile", label: "Mobile", icon: Smartphone },
  { mode: "print", label: "Print", icon: Printer },
]

export function DesignToolbar({
  zoom,
  viewport,
  showGrid,
  snapToGrid,
  showLayers,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onViewportChange,
  onToggleGrid,
  onToggleSnap,
  onToggleLayers,
  onVersionHistory,
  onExport,
  onSave,
  onPreview,
  onPublish,
}: DesignToolbarProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-silver bg-primary px-4 py-2 text-white">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="mx-1 h-6 w-px bg-white/20" />
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-9 text-white hover:bg-white/10 hover:text-white"
          onClick={onZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-1 h-6 w-px bg-white/20" />

      <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1">
        {VIEWPORTS.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewportChange(mode)}
            className={cn(
              "flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition",
              viewport === mode
                ? "bg-white text-primary"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-white/20" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-h-9 text-white hover:bg-white/10 hover:text-white",
            showGrid && "bg-white/20"
          )}
          onClick={onToggleGrid}
          title="Toggle grid"
        >
          <Grid3X3 className="h-4 w-4" />
          <span className="hidden md:inline">Grid</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-h-9 text-white hover:bg-white/10 hover:text-white",
            snapToGrid && "bg-white/20"
          )}
          onClick={onToggleSnap}
          title="Snap to grid"
        >
          <Magnet className="h-4 w-4" />
          <span className="hidden md:inline">Snap</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "min-h-9 text-white hover:bg-white/10 hover:text-white",
            showLayers && "bg-white/20"
          )}
          onClick={onToggleLayers}
          title="Toggle layers panel"
        >
          <Layers className="h-4 w-4" />
          <span className="hidden md:inline">Layers</span>
        </Button>
      </div>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 text-white hover:bg-white/10 hover:text-white"
        onClick={onVersionHistory}
      >
        <History className="h-4 w-4" />
        <span className="hidden md:inline">Version History</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 text-white hover:bg-white/10 hover:text-white"
        onClick={onExport}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <div className="mx-1 h-6 w-px bg-white/20" />

      <Button
        variant="ghost"
        size="sm"
        className="min-h-9 text-white hover:bg-white/10 hover:text-white"
        onClick={onSave}
      >
        <Save className="h-4 w-4" />
        Save
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="min-h-9 bg-white/15 text-white hover:bg-white/25"
        onClick={onPreview}
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>
      <Button
        variant="success"
        size="sm"
        className="min-h-9"
        onClick={onPublish}
      >
        <Upload className="h-4 w-4" />
        Publish
      </Button>
    </header>
  )
}
`
)

write(
  "src/components/admin/calendar-design/ElementsPanel.tsx",
  `"use client"

import { useMemo, useState } from "react"
import { ImageIcon, Lightbulb, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { CALENDAR_THEMES } from "@/data/calendar-themes"
import { ELEMENT_CATALOG } from "@/lib/calendar-design/types"
import type { DesignElementType } from "@/lib/calendar-design/types"

interface ElementsPanelProps {
  activeThemeId: string
  onAddElement: (type: DesignElementType) => void
  onApplyTheme: (themeId: string) => void
}

const MEDIA_LIBRARY = [
  { id: "ml-1", name: "Heart Border", emoji: "💕" },
  { id: "ml-2", name: "Lunch Tray", emoji: "🍽️" },
  { id: "ml-3", name: "School Logo", emoji: "🏫" },
  { id: "ml-4", name: "Nutrition Badge", emoji: "🥗" },
  { id: "ml-5", name: "Valentine Banner", emoji: "🎀" },
  { id: "ml-6", name: "Staff Photo Frame", emoji: "📸" },
]

export function ElementsPanel({ activeThemeId, onAddElement, onApplyTheme }: ElementsPanelProps) {
  const [search, setSearch] = useState("")

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ELEMENT_CATALOG
    return ELEMENT_CATALOG.filter(
      (el) => el.label.toLowerCase().includes(q) || el.type.includes(q)
    )
  }, [search])

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-silver bg-white">
      <div className="border-b border-silver px-4 py-3">
        <h2 className="text-sm font-bold text-primary">Add Elements</h2>
        <p className="text-xs text-primary/60">Drag or click to add to canvas</p>
      </div>

      <Tabs defaultValue="elements" className="flex flex-1 flex-col overflow-hidden px-3">
        <TabsList className="mt-3 h-11 shrink-0">
          <TabsTrigger value="elements" className="min-h-9 text-xs">
            Elements
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
`
)

write(
  "src/components/admin/calendar-design/DesignCanvas.tsx",
  `"use client"

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
    <div className="relative flex flex-1 flex-col overflow-hidden bg-silver/20">
      <div className="flex flex-1 items-start justify-center overflow-auto p-6">
        <div
          className="relative origin-top transition-transform duration-200"
          style={{ transform: \`scale(\${zoom})\`, width: canvasWidth, maxWidth: "100%" }}
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
                          borderColor: \`\${theme.colors.border}40\`,
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
        left: \`\${element.x}%\`,
        top: \`\${element.y}%\`,
        width: \`\${element.width}%\`,
        color: themeText,
      }}
    >
      {element.label}
    </button>
  )
}
`
)

write(
  "src/components/admin/calendar-design/PropertiesPanel.tsx",
  `"use client"

import { Input, Label, Select } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { DAILY_BITE_CATEGORIES } from "@/data/daily-bite-facts"
import { CALENDAR_THEMES } from "@/data/calendar-themes"
import type {
  DailyBiteSettings,
  DesignElement,
  DesignPage,
  ElementAppearance,
  StaffPickSettings,
} from "@/lib/calendar-design/types"

interface PropertiesPanelProps {
  page: DesignPage
  selectedElement: DesignElement | null
  onUpdateElement: (id: string, patch: Partial<DesignElement>) => void
  onUpdatePage: (patch: Partial<DesignPage>) => void
  onUpdateAppearance: (id: string, patch: Partial<ElementAppearance>) => void
  onUpdateStaffPick: (id: string, patch: Partial<StaffPickSettings>) => void
  onUpdateDailyBite: (id: string, patch: Partial<DailyBiteSettings>) => void
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-silver/60 px-3 py-2.5">
      <span className="text-sm font-medium text-primary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-success" : "bg-silver/60"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </label>
  )
}

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label className="mb-0">{label}</Label>
        <span className="text-xs font-semibold text-primary/60">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#F28CB8"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-lg border border-silver/60"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 text-sm"
        />
      </div>
    </div>
  )
}

export function PropertiesPanel({
  page,
  selectedElement,
  onUpdateElement,
  onUpdatePage,
  onUpdateAppearance,
  onUpdateStaffPick,
  onUpdateDailyBite,
}: PropertiesPanelProps) {
  const appearance = selectedElement?.appearance

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-silver bg-white">
      <div className="border-b border-silver px-4 py-3">
        <h2 className="text-sm font-bold text-primary">Properties</h2>
        <p className="text-xs text-primary/60">
          {selectedElement ? selectedElement.label : "Select an element"}
        </p>
      </div>

      <Tabs defaultValue="design" className="flex flex-1 flex-col overflow-hidden px-3">
        <TabsList className="mt-3 h-11 shrink-0">
          <TabsTrigger value="design" className="min-h-9 text-xs">
            Design
          </TabsTrigger>
          <TabsTrigger value="layout" className="min-h-9 text-xs">
            Layout
          </TabsTrigger>
          <TabsTrigger value="page" className="min-h-9 text-xs">
            Page Settings
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto pb-4">
          <TabsContent value="design" className="mt-3 space-y-4">
            {selectedElement && appearance ? (
              <>
                <ColorPicker
                  label="Background"
                  value={appearance.backgroundColor}
                  onChange={(v) => onUpdateAppearance(selectedElement.id, { backgroundColor: v })}
                />
                <ColorPicker
                  label="Border Color"
                  value={appearance.borderColor}
                  onChange={(v) => onUpdateAppearance(selectedElement.id, { borderColor: v })}
                />
                <ColorPicker
                  label="Text Color"
                  value={appearance.textColor}
                  onChange={(v) => onUpdateAppearance(selectedElement.id, { textColor: v })}
                />
                <SliderControl
                  label="Border Radius"
                  value={appearance.borderRadius}
                  min={0}
                  max={32}
                  onChange={(v) => onUpdateAppearance(selectedElement.id, { borderRadius: v })}
                />
                <SliderControl
                  label="Padding"
                  value={appearance.padding}
                  min={0}
                  max={48}
                  onChange={(v) => onUpdateAppearance(selectedElement.id, { padding: v })}
                />
                <SliderControl
                  label="Shadow"
                  value={appearance.shadow}
                  min={0}
                  max={100}
                  onChange={(v) => onUpdateAppearance(selectedElement.id, { shadow: v })}
                />
                <Toggle
                  label="Show Title"
                  checked={appearance.showTitle}
                  onChange={(v) => onUpdateAppearance(selectedElement.id, { showTitle: v })}
                />

                {selectedElement.type === "staff_pick" && selectedElement.staffPick && (
                  <div className="space-y-3 rounded-xl border border-silver/60 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary/50">
                      Staff Pick Settings
                    </p>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={selectedElement.staffPick.title}
                        onChange={(e) =>
                          onUpdateStaffPick(selectedElement.id, { title: e.target.value })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <Label>Subtitle</Label>
                      <Input
                        value={selectedElement.staffPick.subtitle}
                        onChange={(e) =>
                          onUpdateStaffPick(selectedElement.id, { subtitle: e.target.value })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <Label>Meal Name</Label>
                      <Input
                        value={selectedElement.staffPick.mealName}
                        onChange={(e) =>
                          onUpdateStaffPick(selectedElement.id, { mealName: e.target.value })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <Label>Staff Name</Label>
                      <Input
                        value={selectedElement.staffPick.staffName}
                        onChange={(e) =>
                          onUpdateStaffPick(selectedElement.id, { staffName: e.target.value })
                        }
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                )}

                {selectedElement.type === "did_you_know" && selectedElement.dailyBite && (
                  <div className="space-y-3 rounded-xl border border-silver/60 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary/50">
                      Daily Bite Settings
                    </p>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={selectedElement.dailyBite.category}
                        onChange={(e) =>
                          onUpdateDailyBite(selectedElement.id, { category: e.target.value })
                        }
                        className="h-10 text-sm"
                      >
                        {DAILY_BITE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.emoji} {cat.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Toggle
                      label="Auto-match theme"
                      checked={selectedElement.dailyBite.autoMatchTheme}
                      onChange={(v) =>
                        onUpdateDailyBite(selectedElement.id, { autoMatchTheme: v })
                      }
                    />
                    <Toggle
                      label="Rotate daily"
                      checked={selectedElement.dailyBite.rotateDaily}
                      onChange={(v) =>
                        onUpdateDailyBite(selectedElement.id, { rotateDaily: v })
                      }
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="py-8 text-center text-sm text-primary/50">
                Click an element on the canvas to edit its appearance.
              </p>
            )}
          </TabsContent>

          <TabsContent value="layout" className="mt-3 space-y-4">
            {selectedElement ? (
              <>
                <SliderControl
                  label="X Position (%)"
                  value={selectedElement.x}
                  min={0}
                  max={100}
                  onChange={(v) => onUpdateElement(selectedElement.id, { x: v })}
                />
                <SliderControl
                  label="Y Position (%)"
                  value={selectedElement.y}
                  min={0}
                  max={100}
                  onChange={(v) => onUpdateElement(selectedElement.id, { y: v })}
                />
                <SliderControl
                  label="Width (%)"
                  value={selectedElement.width}
                  min={10}
                  max={100}
                  onChange={(v) => onUpdateElement(selectedElement.id, { width: v })}
                />
                <SliderControl
                  label="Height (%)"
                  value={selectedElement.height}
                  min={5}
                  max={100}
                  onChange={(v) => onUpdateElement(selectedElement.id, { height: v })}
                />
                <SliderControl
                  label="Spacing"
                  value={selectedElement.appearance.spacing}
                  min={0}
                  max={48}
                  onChange={(v) =>
                    onUpdateAppearance(selectedElement.id, { spacing: v })
                  }
                />
              </>
            ) : (
              <p className="py-8 text-center text-sm text-primary/50">
                Select an element to adjust layout.
              </p>
            )}
          </TabsContent>

          <TabsContent value="page" className="mt-3 space-y-4">
            <div>
              <Label>Page Title</Label>
              <Input
                value={page.title}
                onChange={(e) => onUpdatePage({ title: e.target.value })}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <Label>Theme</Label>
              <Select
                value={page.themeId}
                onChange={(e) => onUpdatePage({ themeId: e.target.value })}
                className="h-10 text-sm"
              >
                {CALENDAR_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emoji} {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Page Notes</Label>
              <Textarea
                placeholder="Internal notes for this calendar page..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
`
)

write(
  "src/components/admin/calendar-design/PageStrip.tsx",
  `"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { getThemeById } from "@/data/calendar-themes"
import type { DesignPage } from "@/lib/calendar-design/types"

interface PageStripProps {
  pages: DesignPage[]
  activePageId: string
  onSelectPage: (pageId: string) => void
  onAddPage: () => void
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function PageStrip({ pages, activePageId, onSelectPage, onAddPage }: PageStripProps) {
  return (
    <footer className="flex shrink-0 items-center gap-3 border-t border-silver bg-primary px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Pages</span>
      <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
        {pages.map((page) => {
          const theme = getThemeById(page.themeId)
          const active = page.id === activePageId
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-2 transition",
                active
                  ? "border-white bg-white/15 ring-2 ring-white/40"
                  : "border-white/20 hover:border-white/40 hover:bg-white/10"
              )}
            >
              <div
                className="flex h-14 w-20 items-center justify-center rounded-lg text-lg font-bold"
                style={{
                  background: theme.colors.headerBg,
                  color: theme.colors.headerText,
                }}
              >
                {theme.emoji}
              </div>
              <span className="text-[10px] font-semibold text-white">
                {MONTH_ABBR[page.month - 1]} {page.year}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onAddPage}
          className="flex h-[4.75rem] w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/30 text-white/70 transition hover:border-white/50 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Add Page</span>
        </button>
      </div>
    </footer>
  )
}
`
)

write(
  "src/components/admin/calendar-design/ExportDesignModal.tsx",
  `"use client"

import { FileImage, FileText, Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExportDesignModalProps {
  open: boolean
  onClose: () => void
}

const EXPORT_OPTIONS = [
  {
    id: "pdf",
    label: "Export as PDF",
    description: "High-quality PDF for printing and sharing",
    icon: FileText,
  },
  {
    id: "png",
    label: "Export as PNG",
    description: "Image file for digital displays and social media",
    icon: FileImage,
  },
  {
    id: "print",
    label: "Print Calendar",
    description: "Send directly to your printer",
    icon: Printer,
  },
] as const

export function ExportDesignModal({ open, onClose }: ExportDesignModalProps) {
  if (!open) return null

  function handleExport(optionId: string) {
    if (optionId === "print") {
      window.print()
    } else {
      alert(\`Export as \${optionId.toUpperCase()} — coming soon!\`)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-silver bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">Export Design</h2>
            <p className="text-sm text-primary/60">Choose your export format</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-primary/60 transition hover:bg-silver/20 hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {EXPORT_OPTIONS.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleExport(id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border border-silver/60 p-4 text-left transition",
                "hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">{label}</p>
                <p className="text-xs text-primary/60">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
`
)

write(
  "src/components/admin/calendar-design/CalendarDesignStudio.tsx",
  `"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DesignToolbar } from "@/components/admin/calendar-design/DesignToolbar"
import { ElementsPanel } from "@/components/admin/calendar-design/ElementsPanel"
import { DesignCanvas } from "@/components/admin/calendar-design/DesignCanvas"
import { PropertiesPanel } from "@/components/admin/calendar-design/PropertiesPanel"
import { PageStrip } from "@/components/admin/calendar-design/PageStrip"
import { ExportDesignModal } from "@/components/admin/calendar-design/ExportDesignModal"
import { createDefaultPage } from "@/lib/calendar-design/defaults"
import {
  debounce,
  loadDesignDocument,
  saveDesignDocument,
} from "@/lib/calendar-design/storage"
import { DEFAULT_APPEARANCE } from "@/lib/calendar-design/defaults"
import { ELEMENT_CATALOG } from "@/lib/calendar-design/types"
import type {
  CalendarDesignDocument,
  DesignElement,
  DesignElementType,
  ElementAppearance,
  ViewportMode,
} from "@/lib/calendar-design/types"

const MAX_HISTORY = 50

function cloneDoc(doc: CalendarDesignDocument): CalendarDesignDocument {
  return JSON.parse(JSON.stringify(doc)) as CalendarDesignDocument
}

function createElementFromCatalog(type: DesignElementType): DesignElement {
  const catalog = ELEMENT_CATALOG.find((c) => c.type === type)
  const id = \`el-\${type}-\${Date.now()}\`
  return {
    id,
    type,
    label: catalog?.label ?? type,
    x: 10,
    y: 10,
    width: 30,
    height: 15,
    appearance: { ...DEFAULT_APPEARANCE },
    ...(type === "staff_pick"
      ? {
          staffPick: {
            title: "Staff Pick of the Week",
            subtitle: "This week's favorite from our team",
            mealName: "Featured Meal",
            staffName: "Staff Member",
          },
        }
      : {}),
    ...(type === "did_you_know"
      ? {
          dailyBite: {
            category: "food-facts",
            autoMatchTheme: true,
            rotateDaily: true,
            factIndex: 0,
          },
        }
      : {}),
  }
}

export function CalendarDesignStudio() {
  const [doc, setDoc] = useState<CalendarDesignDocument>(() => loadDesignDocument())
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [viewport, setViewport] = useState<ViewportMode>("desktop")
  const [showGrid, setShowGrid] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showLayers, setShowLayers] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [history, setHistory] = useState<CalendarDesignDocument[]>([])
  const [future, setFuture] = useState<CalendarDesignDocument[]>([])
  const initialized = useRef(false)

  const debouncedSave = useMemo(
    () => debounce((next: CalendarDesignDocument) => saveDesignDocument(next), 800),
    []
  )

  const activePage = useMemo(
    () => doc.pages.find((p) => p.id === doc.activePageId) ?? doc.pages[0],
    [doc]
  )

  const selectedElement = useMemo(
    () => activePage?.elements.find((el) => el.id === selectedElementId) ?? null,
    [activePage, selectedElementId]
  )

  const pushHistory = useCallback((prev: CalendarDesignDocument) => {
    setHistory((h) => [...h.slice(-(MAX_HISTORY - 1)), cloneDoc(prev)])
    setFuture([])
  }, [])

  const updateDoc = useCallback(
    (updater: (prev: CalendarDesignDocument) => CalendarDesignDocument) => {
      setDoc((prev) => {
        pushHistory(prev)
        const next = updater(prev)
        debouncedSave(next)
        return next
      })
    },
    [debouncedSave, pushHistory]
  )

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
  }, [])

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setDoc((current) => {
        setFuture((f) => [cloneDoc(current), ...f])
        debouncedSave(prev)
        return prev
      })
      return h.slice(0, -1)
    })
  }, [debouncedSave])

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]
      setDoc((current) => {
        setHistory((h) => [...h, cloneDoc(current)])
        debouncedSave(next)
        return next
      })
      return f.slice(1)
    })
  }, [debouncedSave])

  const handleAddElement = useCallback(
    (type: DesignElementType) => {
      const el = createElementFromCatalog(type)
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, elements: [...p.elements, el] } : p
        ),
      }))
      setSelectedElementId(el.id)
    },
    [updateDoc]
  )

  const handleApplyTheme = useCallback(
    (themeId: string) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, themeId } : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateElement = useCallback(
    (id: string, patch: Partial<DesignElement>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateAppearance = useCallback(
    (id: string, patch: Partial<ElementAppearance>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === id ? { ...el, appearance: { ...el.appearance, ...patch } } : el
                ),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateStaffPick = useCallback(
    (id: string, patch: Partial<NonNullable<DesignElement["staffPick"]>>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === id && el.staffPick
                    ? { ...el, staffPick: { ...el.staffPick, ...patch } }
                    : el
                ),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdateDailyBite = useCallback(
    (id: string, patch: Partial<NonNullable<DesignElement["dailyBite"]>>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId
            ? {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === id && el.dailyBite
                    ? { ...el, dailyBite: { ...el.dailyBite, ...patch } }
                    : el
                ),
              }
            : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleUpdatePage = useCallback(
    (patch: Partial<typeof activePage>) => {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) =>
          p.id === prev.activePageId ? { ...p, ...patch } : p
        ),
      }))
    },
    [updateDoc]
  )

  const handleSelectPage = useCallback((pageId: string) => {
    setSelectedElementId(null)
    updateDoc((prev) => ({ ...prev, activePageId: pageId }))
  }, [updateDoc])

  const handleAddPage = useCallback(() => {
    const last = doc.pages[doc.pages.length - 1]
    let nextMonth = last.month + 1
    let nextYear = last.year
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    const newPage = createDefaultPage(nextMonth, nextYear)
    updateDoc((prev) => ({
      ...prev,
      pages: [...prev.pages, newPage],
      activePageId: newPage.id,
    }))
    setSelectedElementId(null)
  }, [doc.pages, updateDoc])

  const handleSave = useCallback(() => {
    saveDesignDocument(doc)
  }, [doc])

  if (!activePage) return null

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col overflow-hidden">
      <DesignToolbar
        zoom={zoom}
        viewport={viewport}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        showLayers={showLayers}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
        onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
        onViewportChange={setViewport}
        onToggleGrid={() => setShowGrid((v) => !v)}
        onToggleSnap={() => setSnapToGrid((v) => !v)}
        onToggleLayers={() => setShowLayers((v) => !v)}
        onVersionHistory={() => alert("Version history — coming soon!")}
        onExport={() => setExportOpen(true)}
        onSave={handleSave}
        onPreview={() => setViewport("print")}
        onPublish={() => alert("Calendar published successfully!")}
      />

      <div className="flex flex-1 overflow-hidden">
        <ElementsPanel
          activeThemeId={activePage.themeId}
          onAddElement={handleAddElement}
          onApplyTheme={handleApplyTheme}
        />
        <DesignCanvas
          page={activePage}
          zoom={zoom}
          viewport={viewport}
          showGrid={showGrid}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
        />
        <PropertiesPanel
          page={activePage}
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onUpdatePage={handleUpdatePage}
          onUpdateAppearance={handleUpdateAppearance}
          onUpdateStaffPick={handleUpdateStaffPick}
          onUpdateDailyBite={handleUpdateDailyBite}
        />
      </div>

      <PageStrip
        pages={doc.pages}
        activePageId={doc.activePageId}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
      />

      <ExportDesignModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
`
)

write(
  "src/components/layout/AppSidebar.tsx",
  `"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Brain,
  CalendarDays,
  ChefHat,
  ClipboardList,
  DollarSign,
  Download,
  ImageIcon,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Package,
  PackageCheck,
  Palette,
  PartyPopper,
  Receipt,
  ScanLine,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SidebarBrand } from "@/components/layout/SidebarBrand"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: typeof ScanLine
  exact?: boolean
  badge?: string
}

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact && href === "/admin/calendar") {
    return pathname === href
  }
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(\`\${href}/\`)
}

const NAV_SECTIONS: { title: string; links: NavItem[] }[] = [
  {
    title: "Core",
    links: [
      { label: "Scan Station", href: "/kiosk", icon: ScanLine },
      { label: "Admin Portal", href: "/admin", icon: Users },
      { label: "Teacher Portal", href: "/teacher", icon: ClipboardList },
      { label: "Parent Portal", href: "/parent", icon: Wallet },
      { label: "Transactions", href: "/transactions", icon: Wallet },
    ],
  },
  {
    title: "Design Studio",
    links: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Menu Builder", href: "/admin/menu", icon: ChefHat },
      { label: "Calendar", href: "/admin/calendar", icon: CalendarDays, exact: true },
      { label: "Calendar Design ✨", href: "/admin/calendar/design", icon: Palette },
      { label: "Themes", href: "/admin/calendar/themes", icon: Sparkles },
      { label: "Celebration Packs", href: "/admin/calendar/celebration-packs", icon: PartyPopper, badge: "NEW" },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Media Library", href: "/admin/media-library", icon: ImageIcon },
      { label: "Exports", href: "/admin/exports", icon: Download },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    title: "Operations",
    links: [
      { label: "Menu Library", href: "/admin/menu-library", icon: UtensilsCrossed },
      { label: "Receiving", href: "/admin/receiving", icon: PackageCheck },
      { label: "Inventory", href: "/admin/inventory", icon: Package },
      { label: "Production", href: "/admin/production", icon: ChefHat },
      { label: "Receipts", href: "/admin/receipts", icon: Receipt },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { label: "Intelligence", href: "/admin/intelligence", icon: Brain },
      { label: "Forecasting", href: "/admin/forecasting", icon: LineChart },
      { label: "Finance", href: "/admin/finance", icon: DollarSign },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "System",
    links: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Audit Log", href: "/admin/audit-log", icon: ClipboardList },
      { label: "Allergy Review", href: "/admin/allergy-review", icon: ShieldAlert },
      { label: "Ops Center", href: "/ops", icon: LayoutDashboard },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-silver bg-primary text-white">
      <SidebarBrand />

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {NAV_SECTIONS.map(({ title, links }) => (
          <div key={title}>
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              {title}
            </p>
            <div className="space-y-1">
              {links.map(({ label, href, icon: Icon, exact, badge }) => {
                const active = isActive(pathname, href, exact)
                return (
                  <Link
                    key={href + label}
                    href={href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition",
                      active
                        ? "bg-success text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <Badge className="bg-warning/20 px-2 py-0.5 text-[10px] text-warning">
                        {badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
`
)

console.log("Calendar design components written successfully.")
