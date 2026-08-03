import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { scanIdCandidates } from "@/lib/scan/scan-id"

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