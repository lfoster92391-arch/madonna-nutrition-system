/**
 * Normalize kiosk / barcode-scanner input so lunch MD IDs and badge barcodes match.
 *
 * Production stores externalId + barcode as values like MD12214. Scanners may send
 * wrappers (*MD12214*) or prefixes (MD-MD12214); the keypad only enters digits (12214).
 * Leading zeros (012214 vs 12214) must resolve to the same student.
 */

const MAX_MD_PAD_WIDTH = 8

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

/** Digit core of an MD ID / barcode, without leading zeros. */
export function scanNumericCore(raw: string): string | null {
  const digits = normalizeScanToken(raw).replace(/\D/g, "")
  if (!digits) return null
  return digits.replace(/^0+/, "") || "0"
}

function addPaddedNumericVariants(add: (value: string) => void, digits: string) {
  if (!digits) return
  const core = digits.replace(/^0+/, "") || "0"
  add(core)
  add(`MD${core}`)
  add(`MD-${core}`)
  const maxWidth = Math.max(core.length, Math.min(MAX_MD_PAD_WIDTH, Math.max(digits.length, 5)))
  for (let width = core.length; width <= maxWidth; width++) {
    const padded = core.padStart(width, "0")
    add(padded)
    add(`MD${padded}`)
    add(`MD-${padded}`)
  }
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
    addPaddedNumericVariants(add, digits)
  }

  if (normalized.includes("-")) {
    add(normalized.replace(/-/g, ""))
  }

  return [...out]
}

export function scanIdsEquivalent(a: string, b: string): boolean {
  const left = scanIdCandidates(a)
  const right = new Set(scanIdCandidates(b))
  if (left.length === 0 || right.size === 0) return false
  if (left.some((token) => right.has(token))) return true
  const coreA = scanNumericCore(a)
  const coreB = scanNumericCore(b)
  return Boolean(coreA && coreB && coreA === coreB)
}

export function studentMatchesScanId(
  student: { id: string; barcode?: string | null },
  scanId: string
): boolean {
  return scanMatchScore(student, scanId) > 0
}

/** Higher score wins when several roster rows could match padded / prefixed forms. */
export function scanMatchScore(
  student: { id: string; barcode?: string | null },
  scanId: string
): number {
  const n = normalizeScanToken(scanId)
  if (!n) return 0
  const ext = normalizeScanToken(student.id)
  const bar = student.barcode ? normalizeScanToken(student.barcode) : ""
  if (ext === n || (bar && bar === n)) return 100

  const core = scanNumericCore(scanId)
  if (core) {
    const mdCore = `MD${core}`
    const canonical = `MD${core.padStart(5, "0")}`
    if (ext === canonical || bar === canonical) return 80
    if (ext === mdCore || bar === mdCore) return 70
  }

  const candidates = new Set(scanIdCandidates(scanId))
  const keys = [...scanIdCandidates(student.id), ...(bar ? scanIdCandidates(student.barcode!) : [])]
  if (keys.some((key) => candidates.has(key))) return 40

  if (core) {
    if (scanNumericCore(student.id) === core) return 10
    if (bar && scanNumericCore(student.barcode!) === core) return 10
  }
  return 0
}

export function findStudentMatchingScan<T extends { id: string; barcode?: string | null }>(
  students: T[],
  scanId: string
): T | undefined {
  const ranked = students
    .map((student) => ({ student, score: scanMatchScore(student, scanId) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
  if (ranked.length === 0) return undefined
  if (ranked.length === 1 || ranked[0]!.score > ranked[1]!.score) return ranked[0]!.student
  return ranked[0]!.student
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

export function transactionMatchesStudent(
  tx: { studentId: string },
  student: { id: string; barcode?: string | null }
): boolean {
  return studentMatchesScanId(student, tx.studentId)
}

/** True when the token looks like a Prisma cuid, not an MD lunch number. */
export function looksLikeInternalStudentId(raw: string): boolean {
  const token = raw.trim()
  if (token.length < 20) return false
  if (/^md/i.test(token)) return false
  return /^c[a-z0-9]{20,}$/i.test(token)
}
