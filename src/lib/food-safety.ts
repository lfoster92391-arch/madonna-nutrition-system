import { z } from "zod"
import type { Allergy, AllergySeverity, Student } from "@/lib/types"
import { demoMenus, todaysMenuItems } from "@/data/demo"

export const ALLERGY_OPTIONS = [
  "Peanut",
  "Tree Nut",
  "Dairy",
  "Egg",
  "Soy",
  "Wheat",
  "Shellfish",
  "Fish",
  "Sesame",
  "Gluten",
  "Other",
] as const

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "No Pork",
  "No Beef",
  "Dairy Free",
  "Gluten Free",
  "Other",
] as const

export const crossContactSchema = z.object({
  avoidSharedEquipment: z.boolean(),
  traceAmountsTrigger: z.boolean(),
  ingredientOnly: z.boolean(),
})

export const foodSafetyFormSchema = z
  .object({
    allergies: z.array(z.string()).min(0),
    otherAllergyDescription: z.string().optional(),
    severity: z.enum(["severe", "moderate", "informational"], {
      message: "Severity is required",
    }),
    reactionInfo: z.string().optional(),
    crossContact: crossContactSchema,
    dietaryRestrictions: z.array(z.string()),
    otherDietaryDescription: z.string().optional(),
    emergencyMealNotes: z.string().optional(),
    medicalNotes: z.string().optional(),
    emergencyFoodContactName: z.string().min(2, "Emergency contact name is required"),
    emergencyFoodContactPhone: z.string().min(7, "Emergency contact phone is required"),
    consentConfirmed: z.literal(true, {
      message: "You must confirm the information is accurate and kept current",
    }),
    electronicSignature: z.string().min(2, "Signature is required"),
    signatureDate: z.string().min(1),
  })
  .refine(
    (data) =>
      !data.allergies.includes("Other") ||
      (data.otherAllergyDescription?.trim().length ?? 0) > 0,
    {
      message: "Please describe the other allergy",
      path: ["otherAllergyDescription"],
    }
  )

export type FoodSafetyFormValues = z.infer<typeof foodSafetyFormSchema>

const ALLERGEN_ALIASES: Record<string, string[]> = {
  peanut: ["peanut", "peanuts"],
  "tree nut": ["tree nut", "tree nuts", "nuts"],
  dairy: ["dairy", "milk", "lactose"],
  egg: ["egg", "eggs"],
  soy: ["soy", "soya"],
  wheat: ["wheat", "gluten"],
  shellfish: ["shellfish", "shrimp", "crab"],
  fish: ["fish"],
  sesame: ["sesame"],
  gluten: ["gluten", "wheat"],
}

function normalizeAllergen(name: string) {
  return name.toLowerCase().trim()
}

function allergenMatchesMenu(allergyName: string, menuAllergen: string) {
  const a = normalizeAllergen(allergyName)
  const m = normalizeAllergen(menuAllergen)
  if (a.includes(m) || m.includes(a)) return true
  for (const [key, aliases] of Object.entries(ALLERGEN_ALIASES)) {
    if (aliases.some((alias) => a.includes(alias)) && aliases.some((alias) => m.includes(alias))) {
      return true
    }
    if (a.includes(key) && aliases.some((alias) => m.includes(alias))) return true
  }
  return false
}

function getTodaysMenuAllergens(): string[] {
  const today = new Date().toISOString().slice(0, 10)
  const fromMenus = demoMenus
    .filter((m) => m.date === today)
    .flatMap((m) => m.allergens)
  const fromItems = todaysMenuItems.flatMap((item) => {
    const lower = item.toLowerCase()
    const found: string[] = []
    if (lower.includes("milk")) found.push("Dairy")
    if (lower.includes("meat") || lower.includes("sauce")) found.push("Gluten")
    if (lower.includes("bread")) found.push("Gluten", "Wheat")
    return found
  })
  return [...new Set([...fromMenus, ...fromItems])]
}

export function checkMealCompatibility(student: Student): "SAFE" | "BLOCKED" {
  const severeAllergies = student.allergies.filter((a) => a.severity === "severe")
  if (severeAllergies.length === 0) return "SAFE"

  const menuAllergens = getTodaysMenuAllergens()
  for (const allergy of severeAllergies) {
    for (const menuAllergen of menuAllergens) {
      if (allergenMatchesMenu(allergy.name, menuAllergen)) {
        return "BLOCKED"
      }
    }
    for (const item of todaysMenuItems) {
      if (allergenMatchesMenu(allergy.name, item)) {
        return "BLOCKED"
      }
    }
  }
  return "SAFE"
}

export function payloadToAllergies(payload: {
  allergies: string[]
  otherAllergyDescription?: string
  severity: AllergySeverity
}): Allergy[] {
  const names = payload.allergies
    .filter((a) => a !== "Other")
    .concat(payload.otherAllergyDescription ? [payload.otherAllergyDescription] : [])
  return names.map((name) => ({
    name,
    severity: payload.severity as AllergySeverity,
  }))
}

export function daysSince(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null
  const diff = Date.now() - new Date(dateIso).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function formatDaysAgo(dateIso: string | null | undefined): string {
  const days = daysSince(dateIso)
  if (days === null) return "Never verified"
  if (days === 0) return "Today"
  if (days === 1) return "1 day ago"
  return `${days} days ago`
}

export function isReviewDue(expiresAt: string | null | undefined, withinDays = 30): boolean {
  if (!expiresAt) return true
  const expires = new Date(expiresAt).getTime()
  const threshold = Date.now() + withinDays * 24 * 60 * 60 * 1000
  return expires <= threshold
}

export function addOneYear(from = new Date()): string {
  const d = new Date(from)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString()
}

export function getChangeDiff(
  oldAllergies: Allergy[],
  newAllergies: Allergy[],
  oldDietary: string[],
  newDietary: string[]
): { changeType: string; oldValue: string; newValue: string }[] {
  const diffs: { changeType: string; oldValue: string; newValue: string }[] = []
  const oldAllergyStr = oldAllergies.map((a) => `${a.name} (${a.severity})`).join(", ") || "None"
  const newAllergyStr = newAllergies.map((a) => `${a.name} (${a.severity})`).join(", ") || "None"
  if (oldAllergyStr !== newAllergyStr) {
    diffs.push({ changeType: "Allergies", oldValue: oldAllergyStr, newValue: newAllergyStr })
  }
  const oldDiet = oldDietary.join(", ") || "None"
  const newDiet = newDietary.join(", ") || "None"
  if (oldDiet !== newDiet) {
    diffs.push({ changeType: "Dietary", oldValue: oldDiet, newValue: newDiet })
  }
  return diffs.length > 0 ? diffs : [{ changeType: "Profile Update", oldValue: oldAllergyStr, newValue: newAllergyStr }]
}
