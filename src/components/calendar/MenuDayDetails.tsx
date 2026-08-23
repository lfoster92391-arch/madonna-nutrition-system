"use client"

import { isLocalMealPhotoUrl, PHOTO_SLOTS } from "@/lib/meal-templates"
import {
  menuDayHasFullDetails,
  resolveMenuDay,
  type MenuDayComponent,
  type ResolvedMenuDay,
} from "@/lib/menu-day-details"
import type { CalendarEvent, MealTemplate } from "@/lib/types"
import { cn } from "@/lib/utils"

type MenuDayDetailsProps = {
  event: CalendarEvent
  mealTemplatesById?: Map<string, MealTemplate>
  /** Compact list for calendar side panels */
  compact?: boolean
  className?: string
  /** Optional content under the menu (e.g. order / reservation actions) */
  children?: React.ReactNode
}

const SECTION_ORDER: {
  key: keyof Pick<ResolvedMenuDay, "sides" | "fruits" | "desserts" | "drinks">
  label: string
}[] = [
  { key: "sides", label: "Sides" },
  { key: "fruits", label: "Fruits" },
  { key: "desserts", label: "Desserts" },
  { key: "drinks", label: "Drinks" },
]

function ComponentList({ items, label }: { items: MenuDayComponent[]; label: string }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-primary/60">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-silver-foreground">
            <span className="mr-1.5 text-primary/40" aria-hidden>
              •
            </span>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Full published lunch offering for a menu_day: main + sides/fruits/desserts/drinks,
 * photos by cookbook slot, allergens, and notes from the linked meal template.
 */
export function MenuDayDetails({
  event,
  mealTemplatesById,
  compact = false,
  className,
  children,
}: MenuDayDetailsProps) {
  const menu = resolveMenuDay(event, mealTemplatesById)
  const hasDetails = menuDayHasFullDetails(menu)
  const slotOrder = PHOTO_SLOTS.map((s) => s.id)
  const orderedPhotos = [...menu.photos].sort(
    (a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot)
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-primary/60">Main</p>
        <p className={cn("font-bold text-primary", compact ? "text-base" : "text-lg")}>
          {menu.mainName}
        </p>
        {menu.description && menu.description !== menu.mainName ? (
          <p className="mt-2 text-sm leading-relaxed text-silver-foreground">{menu.description}</p>
        ) : null}
      </div>

      {hasDetails ? (
        <div className={cn("grid gap-4", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
          {SECTION_ORDER.map(({ key, label }) => (
            <ComponentList key={key} items={menu[key]} label={label} />
          ))}
        </div>
      ) : event.category === "menu_day" ? (
        <p className="text-sm text-silver-foreground">
          Full tray details are not linked for this day yet. The main lunch above is what is
          published.
        </p>
      ) : null}

      {menu.ingredients.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary/60">Ingredients</p>
          <p className="mt-1.5 text-sm text-silver-foreground">{menu.ingredients.join(", ")}</p>
        </div>
      ) : null}

      {orderedPhotos.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary/60">
            On the tray
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {orderedPhotos.map((photo) => (
              <figure key={photo.id} className="min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.label}
                  className="aspect-square w-full rounded-xl object-cover"
                  data-unoptimized={isLocalMealPhotoUrl(photo.url) ? "true" : undefined}
                />
                <figcaption className="mt-1 truncate text-center text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                  {photo.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      {menu.allergens.length > 0 ? (
        <p className="text-xs font-medium text-silver-foreground">
          Allergens: {menu.allergens.join(", ")}
        </p>
      ) : null}

      {menu.portionNotes ? (
        <p className="text-xs text-silver-foreground">Portions: {menu.portionNotes}</p>
      ) : null}

      {menu.nutritionNotes ? (
        <p className="text-xs text-silver-foreground">{menu.nutritionNotes}</p>
      ) : null}

      {children}
    </div>
  )
}
