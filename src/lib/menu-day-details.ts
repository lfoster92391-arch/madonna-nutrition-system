import { PHOTO_SLOTS } from "@/lib/meal-templates"
import type { CalendarEvent, MealPhoto, MealTemplate } from "@/lib/types"

export type MenuComponentKind = "main" | "side" | "dessert" | "fruit" | "drink" | "other"

export type MenuDayComponent = {
  id: string
  name: string
  kind: MenuComponentKind
}

export type MenuDayPhoto = {
  id: string
  slot: MealPhoto["slot"]
  label: string
  url: string
}

export type ResolvedMenuDay = {
  title: string
  description?: string
  mainName: string
  components: MenuDayComponent[]
  /** Grouped tray items for plain-language sections */
  sides: MenuDayComponent[]
  desserts: MenuDayComponent[]
  fruits: MenuDayComponent[]
  drinks: MenuDayComponent[]
  other: MenuDayComponent[]
  photos: MenuDayPhoto[]
  allergens: string[]
  portionNotes?: string
  nutritionNotes?: string
  ingredients: string[]
  template?: MealTemplate
}

const FRUIT_RE =
  /\b(fruit|apple|orange|banana|berr(?:y|ies)|melon|peach|pear|grape|raisin|pineapple|mango|kiwi|citrus|fruit\s*cup)\b/i
const DESSERT_RE =
  /\b(dessert|cookie|brownie|cake|pudding|ice\s*cream|pie|cupcake|treat|sweet|bar|jello|gelatin)\b/i
const DRINK_RE = /\b(milk|juice|water|drink|beverage|lemonade|tea)\b/i
const SIDE_RE =
  /\b(side|salad|veggie|vegetable|carrot|broccoli|corn|potato|fries|rice|bean|roll|bread|coleslaw|slaw|chips)\b/i

export function classifyMenuComponentName(name: string): MenuComponentKind {
  const n = name.trim()
  if (!n) return "other"
  if (FRUIT_RE.test(n)) return "fruit"
  if (DESSERT_RE.test(n)) return "dessert"
  if (DRINK_RE.test(n)) return "drink"
  if (SIDE_RE.test(n)) return "side"
  return "side"
}

export function resolveMenuDay(
  event: CalendarEvent,
  mealTemplatesById?: Map<string, MealTemplate>
): ResolvedMenuDay {
  const template = event.mealTemplateId
    ? mealTemplatesById?.get(event.mealTemplateId)
    : undefined

  const mainName = (template?.name || event.title || "Lunch").trim()
  const description =
    (template?.description?.trim() || event.description?.trim() || undefined) ?? undefined

  const components: MenuDayComponent[] = (template?.items ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      name: item.name,
      kind: classifyMenuComponentName(item.name),
    }))

  // If the event description lists comma-separated sides and there is no template item list,
  // surface those names so parents still see the full offering.
  if (components.length === 0 && event.description?.trim()) {
    const parts = event.description
      .split(/[,;•\n]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 1 && p.toLowerCase() !== mainName.toLowerCase())
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]!
      components.push({
        id: `desc-${i}-${name}`,
        name,
        kind: classifyMenuComponentName(name),
      })
    }
  }

  const sides = components.filter((c) => c.kind === "side" || c.kind === "other")
  const desserts = components.filter((c) => c.kind === "dessert")
  const fruits = components.filter((c) => c.kind === "fruit")
  const drinks = components.filter((c) => c.kind === "drink")
  const other: MenuDayComponent[] = []

  const slotLabel = new Map(PHOTO_SLOTS.map((s) => [s.id, s.label]))
  const photos: MenuDayPhoto[] = (template?.photos ?? []).map((photo) => ({
    id: photo.id,
    slot: photo.slot,
    label: slotLabel.get(photo.slot) ?? photo.slot,
    url: photo.url,
  }))

  return {
    title: event.title,
    description,
    mainName,
    components,
    sides,
    desserts,
    fruits,
    drinks,
    other,
    photos,
    allergens: template?.allergens ?? [],
    portionNotes: template?.portionNotes,
    nutritionNotes: template?.nutritionNotes,
    ingredients: template?.ingredients ?? [],
    template,
  }
}

export function menuDayHasFullDetails(menu: ResolvedMenuDay): boolean {
  return (
    menu.components.length > 0 ||
    menu.photos.length > 0 ||
    Boolean(menu.description) ||
    menu.ingredients.length > 0
  )
}
