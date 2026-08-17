import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { scanIdCandidates } from "@/lib/scan/scan-id"
import { parseMadonnaStudentLocalPart } from "@/lib/students/grade-from-email"

export const studentInclude = {
  allergies: true,
  parentLinks: { include: { parent: true } },
  profile: true,
} as const

export async function findStudentByExternalId(externalId: string) {
  const schoolId = await resolveSchoolId()
  return prisma.student.findUnique({
    where: { schoolId_externalId: { schoolId, externalId } },
    include: studentInclude,
  })
}

export async function findStudentByEmail(email: string) {
  const schoolId = await resolveSchoolId()
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  return prisma.student.findFirst({
    where: { schoolId, email: normalized },
    include: studentInclude,
  })
}

export async function findStudentByName(firstName: string, lastName: string) {
  const schoolId = await resolveSchoolId()
  return prisma.student.findFirst({
    where: {
      schoolId,
      firstName: { equals: firstName.trim(), mode: "insensitive" },
      lastName: { equals: lastName.trim(), mode: "insensitive" },
    },
    include: studentInclude,
  })
}

/**
 * Match Madonna directory emails (initial + lastName + YY) to an existing roster
 * row when first names in the CSV differ (e.g. lmorris31 → Liam Morris).
 */
export async function findStudentByMadonnaEmailHint(email: string, schoolId?: string) {
  const resolvedSchoolId = schoolId ?? (await resolveSchoolId())
  const parsed = parseMadonnaStudentLocalPart(email)
  if (!parsed) return null

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
  const hint = normalize(parsed.lastNameHint)

  const candidates = await prisma.student.findMany({
    where: {
      schoolId: resolvedSchoolId,
      firstName: { startsWith: parsed.initial, mode: "insensitive" },
    },
    include: studentInclude,
  })

  const matches = candidates.filter((s) => normalize(s.lastName) === hint)
  if (matches.length === 1) return matches[0]!
  return null
}

/** Allocate the next MD###### id after the highest existing numeric MD suffix. */
export async function allocateNextMdId(schoolId?: string): Promise<string> {
  const resolvedSchoolId = schoolId ?? (await resolveSchoolId())
  const students = await prisma.student.findMany({
    where: {
      schoolId: resolvedSchoolId,
      externalId: { startsWith: "MD" },
    },
    select: { externalId: true },
  })

  let max = 0
  for (const s of students) {
    const n = Number(s.externalId.replace(/^MD/i, ""))
    if (Number.isFinite(n) && n > max) max = n
  }
  return `MD${String(max + 1).padStart(5, "0")}`
}

/** Resolve a kiosk scan value by MD ID (externalId) or physical badge barcode. */
export async function findStudentByScanId(scanId: string) {
  const schoolId = await resolveSchoolId()
  const candidates = scanIdCandidates(scanId)
  if (candidates.length === 0) return null

  const byExternalId = await prisma.student.findFirst({
    where: {
      schoolId,
      externalId: { in: candidates },
    },
    include: studentInclude,
  })
  if (byExternalId) return byExternalId

  return prisma.student.findFirst({
    where: {
      schoolId,
      barcode: { in: candidates },
    },
    include: studentInclude,
  })
}

export async function assertBarcodeAvailable(
  barcode: string | null | undefined,
  schoolId: string,
  excludeStudentId?: string
): Promise<string | null> {
  const trimmed = barcode?.trim()
  if (!trimmed) return null

  const existing = await prisma.student.findFirst({
    where: {
      schoolId,
      barcode: trimmed,
      ...(excludeStudentId ? { NOT: { id: excludeStudentId } } : {}),
    },
    select: { externalId: true, firstName: true, lastName: true },
  })

  if (existing) {
    return `Barcode ${trimmed} is already assigned to ${existing.firstName} ${existing.lastName} (MD ID ${existing.externalId}).`
  }

  return null
}

export async function findStudentInternalId(externalId: string): Promise<string | null> {
  const student = await findStudentByExternalId(externalId)
  return student?.id ?? null
}