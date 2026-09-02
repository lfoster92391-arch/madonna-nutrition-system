/** Calendar month helpers for admin financial reporting (YYYY-MM). */

const MONTH_PARAM_RE = /^\d{4}-(0[1-9]|1[0-2])$/

export function currentMonthParam(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function parseMonthParam(value: string | null | undefined): string | null {
  if (!value || !MONTH_PARAM_RE.test(value)) return null
  return value
}

export function monthParamFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function monthRangeFromParam(monthParam: string): { start: Date; end: Date } {
  const [yearStr, monthStr] = monthParam.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr) - 1
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function formatMonthLabel(monthParam: string): string {
  const { start } = monthRangeFromParam(monthParam)
  return start.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

export function shiftMonthParam(monthParam: string, delta: number): string {
  const { start } = monthRangeFromParam(monthParam)
  const shifted = new Date(start.getFullYear(), start.getMonth() + delta, 1)
  return monthParamFromDate(shifted)
}

export function isDateInMonth(date: Date | string | number | undefined, monthParam: string): boolean {
  if (!date) return false
  const d = new Date(date)
  const { start, end } = monthRangeFromParam(monthParam)
  return d >= start && d <= end
}

export function monthSelectOptions(count = 24): Array<{ value: string; label: string }> {
  const now = new Date()
  const options: Array<{ value: string; label: string }> = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = monthParamFromDate(d)
    options.push({ value, label: formatMonthLabel(value) })
  }
  return options
}
