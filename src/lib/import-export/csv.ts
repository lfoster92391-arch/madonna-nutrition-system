import type { ImportExportType, TemplateColumn } from "@/lib/import-export/types"
import { getTemplate } from "@/lib/import-export/templates"

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.startsWith("=")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function rowsToCsv(headers: string[], rows: Record<string, string>[]): string {
  const lines = [headers.map(escapeCsvCell).join(",")]
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h] ?? "")).join(","))
  }
  return lines.join("\n")
}

/** Build CSV using human-readable labels as headers; row values keyed by column.key. */
export function rowsToCsvLabeled(
  columns: Array<Pick<TemplateColumn, "key" | "label">>,
  rows: Record<string, string>[]
): string {
  const lines = [columns.map((c) => escapeCsvCell(c.label)).join(",")]
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvCell(row[c.key] ?? "")).join(","))
  }
  return lines.join("\n")
}

export function downloadCsv(filename: string, content: string) {
  // UTF-8 BOM helps Excel open accented names without mojibake
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadImportTemplate(type: ImportExportType) {
  const template = getTemplate(type)
  // Keep camelCase keys so import wizards and docs stay stable
  const headers = template.columns.map((c) => c.key)
  const content = rowsToCsv(headers, [template.sampleRow])
  downloadCsv(template.filename, content)
}

export function exportRowsToCsv(
  type: ImportExportType,
  rows: Record<string, string>[],
  filenameSuffix = "export"
) {
  const template = getTemplate(type)
  const content = rowsToCsvLabeled(template.columns, rows)
  const baseName = template.filename.replace("-template.csv", "")
  downloadCsv(`${baseName}-${filenameSuffix}.csv`, content)
}

export function getTemplateColumnGuide(type: ImportExportType): string {
  const template = getTemplate(type)
  return template.columns
    .map((c) => `${c.key}${c.required ? " (required)" : ""}${c.description ? ` — ${c.description}` : ""}`)
    .join(", ")
}
