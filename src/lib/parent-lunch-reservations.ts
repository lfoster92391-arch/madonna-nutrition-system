import { formatCurrency } from "@/lib/utils"

/** Parent-facing lunch reservation row from GET /api/lunch-reservations. */
export type ParentLunchReservation = {
  id: string
  studentId: string
  studentName: string
  date: string
  mealType: string
  price: number
  sliceCount?: number | null
  totalAmount?: number | null
  status: string
}

/** Soft palette for multi-child calendar marks (stable by studentId). */
export const PARENT_RESERVATION_COLORS = [
  "#00A83E",
  "#0B6BCB",
  "#C45C26",
  "#6B4C9A",
  "#0F766E",
  "#B45309",
] as const

export function reservationColorForStudent(
  studentId: string,
  palette: readonly string[] = PARENT_RESERVATION_COLORS
): string {
  let hash = 0
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) >>> 0
  }
  return palette[hash % palette.length] ?? palette[0]!
}

export function formatReservationMealLabel(mealType: string): string {
  switch (mealType.toUpperCase()) {
    case "MAIN":
      return "Main lunch"
    case "SIDE":
      return "Side"
    case "MILK":
      return "Milk"
    case "JUICE":
      return "Juice"
    case "ALA_CARTE":
      return "A la carte"
    default:
      return mealType.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  }
}

export function formatReservationDateShort(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

/**
 * Plain-language confirmation, e.g.
 * "Reserved: Main lunch for Alex — Tue Mar 3"
 * "Reserved: Pizza Day (3 slices) for Alex — Tue Mar 3 · $3.00"
 */
export function formatReservationConfirmation(opts: {
  studentName: string
  date: string
  mealType: string
  menuTitle?: string | null
  sliceCount?: number | null
  totalAmount?: number | null
  price?: number | null
}): string {
  const firstName = opts.studentName.trim().split(/\s+/)[0] || opts.studentName
  const dateLabel = formatReservationDateShort(opts.date)
  const slices = opts.sliceCount
  const amount = opts.totalAmount ?? opts.price
  const meal =
    slices && slices > 0
      ? `${opts.menuTitle?.trim() || "Pizza Day"} (${slices} ${slices === 1 ? "slice" : "slices"})`
      : formatReservationMealLabel(opts.mealType)

  const base = `Reserved: ${meal} for ${firstName} — ${dateLabel}`
  if (amount != null && amount >= 0) {
    return `${base} · ${formatCurrency(amount)}`
  }
  return base
}

export function formatReservationDetailLine(row: ParentLunchReservation): string {
  const meal = formatReservationMealLabel(row.mealType)
  const slices = row.sliceCount
    ? ` · ${row.sliceCount} ${row.sliceCount === 1 ? "slice" : "slices"}`
    : ""
  const amount = formatCurrency(row.totalAmount ?? row.price)
  return `${meal}${slices} · ${amount}`
}

export function isActiveReservation(row: ParentLunchReservation): boolean {
  return row.status.toUpperCase() === "RESERVED"
}

export function groupReservationsByDate(
  reservations: ParentLunchReservation[]
): Map<string, ParentLunchReservation[]> {
  const map = new Map<string, ParentLunchReservation[]>()
  for (const row of reservations) {
    if (!isActiveReservation(row)) continue
    const list = map.get(row.date) ?? []
    list.push(row)
    map.set(row.date, list)
  }
  return map
}
