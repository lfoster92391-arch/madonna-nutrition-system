import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"
import { isMainLunchKioskMeal } from "@/lib/lunch-pricing"
import { todayDateOnly } from "@/lib/teacher/db"

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function integerSafeQty(raw: unknown): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 1
  const rounded = Math.round(n)
  if (Math.abs(n - rounded) < 1e-6) return Math.max(1, rounded)
  return 1
}

function parseIngredientEntry(entry: unknown): { name: string; qty: number } | null {
  if (typeof entry === "string") {
    const trimmed = entry.trim()
    if (!trimmed) return null
    const leading = trimmed.match(/^(\d+)\s+(.+)$/)
    if (leading) return { name: leading[2].trim(), qty: Number(leading[1]) }
    return { name: trimmed, qty: 1 }
  }
  if (entry && typeof entry === "object") {
    const row = entry as Record<string, unknown>
    const name = String(row.name ?? row.item ?? row.ingredient ?? "").trim()
    if (!name) return null
    return { name, qty: integerSafeQty(row.qty ?? row.quantity ?? row.amount) }
  }
  return null
}

function ingredientLinesFromTemplate(template: {
  ingredients: unknown
  items: Array<{ name: string }>
}): Array<{ name: string; qty: number }> {
  if (Array.isArray(template.ingredients) && template.ingredients.length > 0) {
    return template.ingredients
      .map(parseIngredientEntry)
      .filter((line): line is { name: string; qty: number } => Boolean(line))
  }
  return template.items
    .map((item) => parseIngredientEntry(item.name))
    .filter((line): line is { name: string; qty: number } => Boolean(line))
}

function isGenericMealLabel(meal: string) {
  const n = meal.trim().toLowerCase()
  return isMainLunchKioskMeal(meal) || n === "lunch" || n === "main meal"
}

export async function deductInventoryForSale(input: {
  schoolId: string
  soldName: string
  soldLabel: string
  createdBy?: string
}): Promise<void> {
  if (!isDatabaseEnabled()) return

  const soldName = input.soldName.trim()
  if (!soldName) return

  try {
    let menuTitle: string | null = null
    if (isGenericMealLabel(soldName)) {
      const todayMenu = await prisma.calendarEvent.findFirst({
        where: { schoolId: input.schoolId, date: todayDateOnly(), category: "menu_day" },
        orderBy: { createdAt: "desc" },
        select: { title: true },
      })
      menuTitle = todayMenu?.title?.trim() || null
    }

    const matchCandidates = [menuTitle, soldName].filter((n): n is string => Boolean(n))

    const [inventory, templates] = await Promise.all([
      prisma.inventoryItem.findMany({
        where: { schoolId: input.schoolId },
        select: { id: true, name: true, qty: true, storageLocationId: true },
      }),
      prisma.mealTemplate.findMany({
        where: { schoolId: input.schoolId, isArchived: false },
        select: { name: true, ingredients: true, items: { select: { name: true } } },
      }),
    ])

    const inventoryByName = new Map(inventory.map((item) => [normalizeName(item.name), item]))
    const templateByName = new Map(templates.map((t) => [normalizeName(t.name), t]))

    const note = `Sale — ${input.soldLabel}`
    const createdBy = input.createdBy?.trim() || "Kiosk"

    const deduct = async (itemId: string, requestedQty: number, onHand: number, storageLocationId: string | null) => {
      const qty = Math.min(Math.max(1, requestedQty), Math.max(0, onHand))
      if (qty <= 0) return false
      await prisma.$transaction([
        prisma.inventoryMovement.create({
          data: {
            type: "usage",
            quantity: -qty,
            note,
            inventoryItemId: itemId,
            storageLocationId,
            schoolId: input.schoolId,
            createdBy,
          },
        }),
        prisma.inventoryItem.update({
          where: { id: itemId },
          data: { qty: Math.max(0, onHand - qty) },
        }),
      ])
      return true
    }

    for (const candidate of matchCandidates) {
      const template = templateByName.get(normalizeName(candidate))
      if (!template) continue
      const lines = ingredientLinesFromTemplate(template)
      if (lines.length === 0) continue

      let deductedAny = false
      const remaining = new Map(inventory.map((item) => [item.id, item.qty]))
      for (const line of lines) {
        const item = inventoryByName.get(normalizeName(line.name))
        if (!item) continue
        const onHand = remaining.get(item.id) ?? item.qty
        const did = await deduct(item.id, line.qty, onHand, item.storageLocationId)
        if (did) {
          deductedAny = true
          remaining.set(item.id, Math.max(0, onHand - Math.min(line.qty, onHand)))
        }
      }
      if (deductedAny) return
    }

    for (const candidate of matchCandidates) {
      const item = inventoryByName.get(normalizeName(candidate))
      if (!item) continue
      await deduct(item.id, 1, item.qty, item.storageLocationId)
      return
    }
  } catch (error) {
    console.error("deductInventoryForSale failed", error)
  }
}
