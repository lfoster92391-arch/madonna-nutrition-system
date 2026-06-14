import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"

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

export async function findStudentInternalId(externalId: string): Promise<string | null> {
  const student = await findStudentByExternalId(externalId)
  return student?.id ?? null
}
