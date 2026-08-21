/** Placeholder / stock images that should not appear in badge/SIS exports. */
const PLACEHOLDER_PHOTO_HINTS = [
  "images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "images.unsplash.com/photo-1604908176997-431cef8a0b38",
]

/** True when a real (non-placeholder) photo is on file — including data URLs. */
export function hasExportablePhoto(photo?: string | null): boolean {
  const p = photo?.trim() ?? ""
  if (!p) return false
  return !PLACEHOLDER_PHOTO_HINTS.some((hint) => p.includes(hint))
}

/**
 * Photo URL safe for CSV/Excel/badge studio.
 * Drops base64 data URLs (huge / unusable) and stock placeholders.
 * Keeps http(s) and relative paths.
 */
export function cleanExportPhotoUrl(photo?: string | null): string {
  const p = photo?.trim() ?? ""
  if (!p) return ""
  if (p.startsWith("data:")) return ""
  if (PLACEHOLDER_PHOTO_HINTS.some((hint) => p.includes(hint))) return ""
  return p
}

export function photoOnFileLabel(photo?: string | null): string {
  return hasExportablePhoto(photo) ? "Yes" : "No"
}

/**
 * Keep numeric IDs as text in Excel so leading zeros are not stripped.
 * Non-numeric IDs (e.g. MD0001, ST-4401) are left unchanged.
 */
export function excelTextId(value: string): string {
  const v = value.trim()
  if (!v) return ""
  if (/^\d+$/.test(v)) return `="${v}"`
  return v
}

/** Undo excelTextId / tab-prefixed text when re-importing an export. */
export function fromExcelTextId(value: string): string {
  const v = value.trim()
  if (!v) return ""
  const formula = /^="(.*)"$/.exec(v)
  if (formula) return formula[1] ?? ""
  if (v.startsWith("\t")) return v.slice(1)
  return v
}
