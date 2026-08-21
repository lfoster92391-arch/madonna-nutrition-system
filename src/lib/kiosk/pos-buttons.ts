import {
  MILK_JUICE_PRICE,
  STUDENT_LUNCH_PRICE,
} from "@/config/onboarding-pricing"
import { prisma } from "@/lib/prisma"
import { canonicalMainMealPricing } from "@/lib/lunch-pricing"
import { isPizzaDayName, PIZZA_SLICE_UNIT_PRICE } from "@/lib/pizza-day"
import type { KioskButtonAudience, KioskButtonCategory, KioskPosButton } from "@prisma/client"

export type KioskPosButtonDto = {
  id: string
  key: string
  label: string
  price: number
  sortOrder: number
  active: boolean
  audience: KioskButtonAudience
  category: KioskButtonCategory
  isSystem: boolean
  grades: string[]
  /** Price is locked to lunch rules (Student/Staff Meal). */
  priceLocked: boolean
}

export type DefaultKioskPosButton = {
  key: string
  label: string
  price: number
  sortOrder: number
  audience: KioskButtonAudience
  category: KioskButtonCategory
  isSystem: boolean
  grades: string[]
}

/** Seed / fallback defaults matching historic MEAL_PRICES on the kiosk. */
export const DEFAULT_KIOSK_POS_BUTTONS: DefaultKioskPosButton[] = [
  {
    key: "student_meal",
    label: "Student Meal",
    price: STUDENT_LUNCH_PRICE,
    sortOrder: 10,
    audience: "STUDENT",
    category: "MEAL",
    isSystem: true,
    grades: [],
  },
  {
    key: "staff_meal",
    label: "Staff Meal",
    price: STUDENT_LUNCH_PRICE,
    sortOrder: 20,
    audience: "STAFF",
    category: "MEAL",
    isSystem: true,
    grades: [],
  },
  {
    key: "milk",
    label: "Milk",
    price: MILK_JUICE_PRICE,
    sortOrder: 30,
    audience: "BOTH",
    category: "DRINK",
    isSystem: false,
    grades: [],
  },
  {
    key: "juice",
    label: "Juice",
    price: MILK_JUICE_PRICE,
    sortOrder: 40,
    audience: "BOTH",
    category: "DRINK",
    isSystem: false,
    grades: [],
  },
  {
    key: "ala_carte",
    label: "À La Carte",
    price: 4.5,
    sortOrder: 50,
    audience: "CASHIER_ONLY",
    category: "ALA_CARTE",
    isSystem: false,
    grades: ["9", "10", "11", "12"],
  },
]

export function isSystemMainMealKey(key: string): boolean {
  return key === "student_meal" || key === "staff_meal"
}

export function mapKioskPosButton(
  row: KioskPosButton,
  options?: { menuTitle?: string | null }
): KioskPosButtonDto {
  const priceLocked = row.isSystem && isSystemMainMealKey(row.key)
  let price = Number(row.price)

  if (priceLocked) {
    if (isPizzaDayName(options?.menuTitle)) {
      price = PIZZA_SLICE_UNIT_PRICE
    } else {
      price = canonicalMainMealPricing({ menuTitle: options?.menuTitle }).totalAmount
    }
  }

  return {
    id: row.id,
    key: row.key,
    label: row.label,
    price,
    sortOrder: row.sortOrder,
    active: row.active,
    audience: row.audience,
    category: row.category,
    isSystem: row.isSystem,
    grades: row.grades ?? [],
    priceLocked,
  }
}

/** Insert missing default buttons for a school (idempotent). */
export async function ensureDefaultKioskPosButtons(schoolId: string): Promise<void> {
  const existing = await prisma.kioskPosButton.findMany({
    where: { schoolId },
    select: { key: true },
  })
  const have = new Set(existing.map((b) => b.key))
  const missing = DEFAULT_KIOSK_POS_BUTTONS.filter((b) => !have.has(b.key))
  if (missing.length === 0) return

  await prisma.kioskPosButton.createMany({
    data: missing.map((b) => ({
      schoolId,
      key: b.key,
      label: b.label,
      price: b.price,
      sortOrder: b.sortOrder,
      audience: b.audience,
      category: b.category,
      isSystem: b.isSystem,
      grades: b.grades,
      active: true,
    })),
    skipDuplicates: true,
  })
}

export async function listKioskPosButtons(
  schoolId: string,
  options?: { activeOnly?: boolean; menuTitle?: string | null }
): Promise<KioskPosButtonDto[]> {
  await ensureDefaultKioskPosButtons(schoolId)
  const rows = await prisma.kioskPosButton.findMany({
    where: {
      schoolId,
      ...(options?.activeOnly ? { active: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  })
  return rows.map((row) => mapKioskPosButton(row, { menuTitle: options?.menuTitle }))
}

export function slugifyCustomKey(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)
  return `custom_${base || "item"}_${Date.now().toString(36)}`
}
