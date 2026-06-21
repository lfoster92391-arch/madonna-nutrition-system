"use client"

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
  className?: string
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
  className,
}: PropertiesPanelProps) {
  const appearance = selectedElement?.appearance

  return (
    <aside className={cn("flex h-full w-80 shrink-0 flex-col border-l border-silver bg-white", className)}>
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
