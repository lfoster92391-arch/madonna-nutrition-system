import type { GradeAvailability, MealCategory, MealPhotoSlot, MealTemplate } from "@/lib/types"

export const MEAL_CATEGORIES: { id: MealCategory; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "special_event", label: "Special Event" },
  { id: "holiday", label: "Holiday" },
  { id: "seasonal", label: "Seasonal" },
  { id: "archived", label: "Archived" },
]

export const CATEGORY_FILTER_PILLS: { id: MealCategory | "all"; label: string }[] = [
  { id: "all", label: "All Meals" },
  ...MEAL_CATEGORIES.filter((c) => c.id !== "archived"),
  { id: "archived", label: "Archived" },
]

export type MealSortOption = "recent" | "name" | "last_used" | "popular"

export const MEAL_SORT_OPTIONS: { id: MealSortOption; label: string }[] = [
  { id: "recent", label: "Most Recent" },
  { id: "name", label: "Name (A–Z)" },
  { id: "last_used", label: "Last Used" },
  { id: "popular", label: "Most Popular" },
]

export const PHOTO_SLOTS: { id: MealPhotoSlot; label: string }[] = [
  { id: "entree", label: "Entrée" },
  { id: "side", label: "Side" },
  { id: "dessert", label: "Dessert" },
  { id: "drink", label: "Drink" },
  { id: "additional", label: "Additional" },
]

export const GRADE_OPTIONS: { id: GradeAvailability; label: string }[] = [
  { id: "grades_7_8", label: "Grades 7–8" },
  { id: "grades_9_12", label: "Grades 9–12" },
  { id: "teacher", label: "Teacher" },
  { id: "staff", label: "Staff" },
]

export const COMMON_ALLERGENS = [
  "Gluten",
  "Dairy",
  "Eggs",
  "Peanut",
  "Tree Nut",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
]

export function getMealCoverPhoto(
  photos: { slot: MealPhotoSlot; url: string }[]
): string | undefined {
  return (
    photos.find((p) => p.slot === "entree")?.url ??
    photos[0]?.url
  )
}

export function formatLastUsed(iso?: string): string {
  if (!iso) return "Never used"
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatLastUsedLabel(iso?: string): string {
  if (!iso) return "Last used: Never"
  const date = new Date(iso)
  return `Last used: ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
}

export function formatCategoryLabel(category: MealCategory): string {
  return MEAL_CATEGORIES.find((c) => c.id === category)?.label ?? category
}

export function formatGradeRange(grades: GradeAvailability[]): string {
  const has78 = grades.includes("grades_7_8")
  const has912 = grades.includes("grades_9_12")
  if (has78 && has912) return "Grades 7–12"
  if (has78) return "Grades 7–8"
  if (has912) return "Grades 9–12"
  if (grades.includes("teacher") && grades.includes("staff")) return "Staff & Teachers"
  if (grades.includes("teacher")) return "Teachers"
  if (grades.includes("staff")) return "Staff"
  return "All grades"
}

export function isNewMeal(template: MealTemplate): boolean {
  const created = new Date(template.createdAt)
  const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return days <= 14
}

export function sortMealTemplates(
  templates: MealTemplate[],
  sort: MealSortOption
): MealTemplate[] {
  const sorted = [...templates]
  switch (sort) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case "last_used":
      return sorted.sort((a, b) => {
        const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0
        const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0
        return bTime - aTime
      })
    case "popular":
      return sorted.sort((a, b) => {
        const aScore = (a.isFavorite ? 2 : 0) + (a.lastUsedAt ? 1 : 0)
        const bScore = (b.isFavorite ? 2 : 0) + (b.lastUsedAt ? 1 : 0)
        return bScore - aScore || a.name.localeCompare(b.name)
      })
    case "recent":
    default:
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
  }
}

export function getDefaultTags(template: MealTemplate): string[] {
  const fromName = template.name.split(/\s+/).filter((w) => w.length > 3).slice(0, 2)
  const tags = new Set<string>(fromName)
  if (template.isFavorite) tags.add("Popular")
  if (template.category === "lunch") tags.add("High Protein")
  return Array.from(tags).slice(0, 4)
}

export function countPhotoLibrary(templates: MealTemplate[]): number {
  return templates.reduce((sum, t) => sum + t.photos.length, 0)
}

export function getMostUsedMeal(templates: MealTemplate[]): MealTemplate | undefined {
  return [...templates]
    .filter((t) => !t.isArchived && t.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())[0]
}

export function getLastLibraryUpdate(templates: MealTemplate[]): string {
  if (templates.length === 0) return "—"
  const latest = templates.reduce((max, t) =>
    new Date(t.updatedAt) > new Date(max) ? t.updatedAt : max
  , templates[0].updatedAt)
  return new Date(latest).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
