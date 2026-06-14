"use client"

import { Monitor, Smartphone, Tablet, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GRADE_OPTIONS } from "@/lib/meal-templates"
import type { MealTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MealPreviewModalProps {
  template: MealTemplate
  coverUrl?: string
  onClose: () => void
}

function MealCardPreview({
  template,
  coverUrl,
  size,
}: {
  template: MealTemplate
  coverUrl?: string
  size: "desktop" | "tablet" | "mobile"
}) {
  const widthClass =
    size === "desktop" ? "max-w-md" : size === "tablet" ? "max-w-sm" : "max-w-[280px]"

  return (
    <div className={cn("mx-auto w-full", widthClass)}>
      <div className="overflow-hidden rounded-2xl border border-silver/60 bg-white shadow-lg">
        {coverUrl ? (
          <div className="aspect-[4/3] w-full overflow-hidden bg-silver/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt={template.name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-silver/20 text-sm text-silver-foreground">
            No photo
          </div>
        )}
        <div className="space-y-3 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-success">Today&apos;s Lunch</p>
            <h3 className="text-xl font-bold text-primary">{template.name}</h3>
            {template.description && (
              <p className="mt-1 text-sm text-silver-foreground">{template.description}</p>
            )}
          </div>
          {template.items.length > 0 && (
            <ul className="space-y-1 text-sm text-primary">
              {template.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  {item.name}
                </li>
              ))}
            </ul>
          )}
          {template.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {template.allergens.map((a) => (
                <Badge key={a} variant="warning" className="text-[10px]">
                  {a}
                </Badge>
              ))}
            </div>
          )}
          {template.studentMealPrice != null && (
            <p className="text-sm font-semibold text-primary">
              Student meal: ${template.studentMealPrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function MealPreviewModal({ template, coverUrl, onClose }: MealPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-silver/60 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Preview</p>
            <h2 className="text-2xl font-bold text-primary">{template.name}</h2>
            <p className="text-sm text-silver-foreground">
              How this meal appears across portals
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close preview">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="desktop">
          <TabsList>
            <TabsTrigger value="desktop">
              <Monitor className="mr-2 h-4 w-4" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="tablet">
              <Tablet className="mr-2 h-4 w-4" />
              Tablet
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="parent">Parent Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="desktop" className="rounded-2xl bg-silver/10 p-8">
            <MealCardPreview template={template} coverUrl={coverUrl} size="desktop" />
          </TabsContent>
          <TabsContent value="tablet" className="rounded-2xl bg-silver/10 p-8">
            <MealCardPreview template={template} coverUrl={coverUrl} size="tablet" />
          </TabsContent>
          <TabsContent value="mobile" className="rounded-2xl bg-silver/10 p-8">
            <MealCardPreview template={template} coverUrl={coverUrl} size="mobile" />
          </TabsContent>
          <TabsContent value="parent" className="rounded-2xl bg-silver/10 p-8">
            <div className="mx-auto max-w-md space-y-4">
              <div className="rounded-2xl border border-silver/60 bg-white p-4">
                <p className="text-xs font-bold uppercase text-success">Madonna High School</p>
                <h3 className="font-bold text-primary">Lunch Calendar</h3>
              </div>
              <MealCardPreview template={template} coverUrl={coverUrl} size="mobile" />
              <p className="text-center text-xs text-silver-foreground">
                Grades:{" "}
                {template.gradeAvailability
                  .map((g) => GRADE_OPTIONS.find((o) => o.id === g)?.label ?? g)
                  .join(", ") || "All"}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
