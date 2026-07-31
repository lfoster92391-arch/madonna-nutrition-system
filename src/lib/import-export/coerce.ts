import { z } from "zod"

/** Coerce Excel/CSV scalars to trimmed strings (numbers, booleans, null -> string). */
export function asTrimmedString(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim()
  return String(value).trim()
}

/** Strip currency symbols/commas; empty -> undefined so optional defaults can apply. */
export function asMoneyNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  const cleaned = String(value).replace(/[$,\s]/g, "").trim()
  if (!cleaned) return undefined
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

export const importString = z.preprocess((val) => asTrimmedString(val), z.string())

export const importRequiredString = z.preprocess(
  (val) => asTrimmedString(val),
  z.string().min(1)
)

export const importOptionalString = z.preprocess((val) => {
  const s = asTrimmedString(val)
  return s === "" ? undefined : s
}, z.string().optional())

export const importOptionalEmail = z.preprocess((val) => {
  const s = asTrimmedString(val)
  return s === "" ? undefined : s
}, z.string().email().optional())

export const importMoney = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return undefined
  const n = asMoneyNumber(val)
  return n === undefined ? val : n
}, z.number().optional())

export const importMoneyDefault0 = z.preprocess((val) => {
  if (val === null || val === undefined || val === "") return 0
  const n = asMoneyNumber(val)
  return n === undefined ? 0 : n
}, z.number())

const BADGE_STATUSES = ["active", "pending", "inactive"] as const
export type BadgeStatusImport = (typeof BADGE_STATUSES)[number]

export function normalizeBadgeStatusValue(
  value: unknown,
  fallback: BadgeStatusImport | undefined = "pending"
): BadgeStatusImport | undefined {
  const raw = asTrimmedString(value).toLowerCase()
  if (!raw) return fallback
  if (raw === "active" || raw === "pending" || raw === "inactive") return raw
  return fallback ?? "pending"
}

export const importBadgeStatus = z.preprocess(
  (val) => normalizeBadgeStatusValue(val, "pending"),
  z.enum(BADGE_STATUSES)
)

export const importOptionalBadgeStatus = z.preprocess((val) => {
  if (val === null || val === undefined || asTrimmedString(val) === "") return undefined
  return normalizeBadgeStatusValue(val, "pending")
}, z.enum(BADGE_STATUSES).optional())

export interface ParsedImportRow<T> {
  index: number
  rowNumber: number
  data: T
}

export interface ImportRowParseError {
  row: number
  message: string
}

export function parseImportRows<T>(
  rows: unknown[],
  rowSchema: z.ZodType<T>,
  options?: { rowNumberOffset?: number }
): { valid: ParsedImportRow<T>[]; errors: ImportRowParseError[] } {
  const offset = options?.rowNumberOffset ?? 1
  const valid: ParsedImportRow<T>[] = []
  const errors: ImportRowParseError[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + offset
    const parsed = rowSchema.safeParse(row)
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""
          return `${path}${issue.message}`
        })
        .join("; ")
      errors.push({ row: rowNumber, message: message || "Invalid row" })
      return
    }
    valid.push({ index, rowNumber, data: parsed.data })
  })

  return { valid, errors }
}

export function assertCsvFile(file: File): string | null {
  const name = file.name.toLowerCase()
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".ods")) {
    return "Excel (.xlsx/.xls) is not supported. Save or export as CSV (.csv) and try again."
  }
  if (
    name &&
    !name.endsWith(".csv") &&
    file.type &&
    !file.type.includes("csv") &&
    !file.type.includes("text")
  ) {
    return "Please upload a CSV (.csv) file."
  }
  return null
}

export function normalizeCsvRecord(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/^\ufeff/, "").trim()] = asTrimmedString(value)
  }
  return out
}

export function pickCsvField(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value) return value
  }
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/[_\s-]/g, ""), v])
  )
  for (const key of keys) {
    const value = normalized[key.toLowerCase().replace(/[_\s-]/g, "")]
    if (value) return value
  }
  return ""
}
