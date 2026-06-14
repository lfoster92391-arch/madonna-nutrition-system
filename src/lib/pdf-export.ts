export interface PdfExportOptions {
  title: string
  filename?: string
  content: string
}

export async function exportToPdf({ title, filename, content }: PdfExportOptions): Promise<void> {
  const safeName = filename ?? `${title.toLowerCase().replace(/\s+/g, "-")}.txt`
  const blob = new Blob([`${title}\n\n${content}`], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = safeName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function isPdfExportSupported(): boolean {
  return typeof window !== "undefined"
}
