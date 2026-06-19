export type ImportExportType =
  | "students"
  | "parents"
  | "badges"
  | "menu"
  | "inventory"
  | "pricing"
  | "vendors"

export interface TemplateColumn {
  key: string
  label: string
  required: boolean
  description?: string
}

export interface ImportExportTemplate {
  type: ImportExportType
  label: string
  filename: string
  columns: TemplateColumn[]
  sampleRow: Record<string, string>
}
