/**
 * Normalize kiosk / barcode-scanner input so lunch MD IDs and badge barcodes match.
 *
 * Production stores externalId + barcode as values like MD12214. Scanners may send
 * wrappers (*MD12214*) or prefixes (MD-MD12214); the keypad only enters digits (12214).
 */

export function normalizeScanToken(raw: string): string {
  return raw
    .trim()
    .replace(/^[*'"\s]+|[*'"\s]+$/g, "")
    .replace(/\s+/g, "")
    .toUpperCase()
}

/** Sanitize live scanner/keypad input while preserving letters used in MD IDs. */
export function sanitizeScanInput(raw: string): string {
  return raw.replace(/[^\w\-*.'"]+/g, "").toUpperCase()
}

export function scanIdCandidates(raw: string): string[] {
  const normalized = normalizeScanToken(raw)
  if (!normalized) return []

  const out = new Set<string>()
  const add = (value: string) => {
    const token = normalizeScanToken(value)
    if (token) out.add(token)
  }

  add(normalized)

  let peeling = normalized
  for (let i = 0; i < 3; i++) {
    if (peeling.startsWith("MD-")) {
      peeling = peeling.slice(3)
      add(peeling)
      continue
    }
    if (/^MD\d/i.test(peeling)) {
      peeling = peeling.slice(2)
      add(peeling)
      continue
    }
    break
  }

  const digits = normalized.replace(/\D/g, "")
  if (digits) {
    add(digits)
    add(`MD${digits}`)
    add(`MD-${digits}`)
  }

  if (normalized.includes("-")) {
    add(normalized.replace(/-/g, ""))
  }

  return [...out]
}

export function studentMatchesScanId(
  student: { id: string; barcode?: string | null },
  scanId: string
): boolean {
  const candidates = new Set(scanIdCandidates(scanId))
  if (candidates.size === 0) return false

  const keys = scanIdCandidates(student.id)
  if (student.barcode) keys.push(...scanIdCandidates(student.barcode))
  return keys.some((key) => candidates.has(key))
}

export function findStudentMatchingScan<T extends { id: string; barcode?: string | null }>(
  students: T[],
  scanId: string
): T | undefined {
  return students.find((student) => studentMatchesScanId(student, scanId))
}

export function staffMatchesScanId(
  user: { badgeId?: string | null },
  scanId: string
): boolean {
  const badgeId = user.badgeId?.trim()
  if (!badgeId) return false
  const candidates = new Set(scanIdCandidates(scanId))
  if (candidates.size === 0) return false
  return scanIdCandidates(badgeId).some((key) => candidates.has(key))
}

export function findStaffMatchingScan<T extends { badgeId?: string | null }>(
  users: T[],
  scanId: string
): T | undefined {
  return users.find((user) => staffMatchesScanId(user, scanId))
}