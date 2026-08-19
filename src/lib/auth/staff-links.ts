import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"
import { isParentCapableDbRole } from "@/lib/auth/portal-roles"
import {
  getParentLinkedStudentSummaries,
  linkParentUserToStudent,
  type LinkedStudentSummary,
} from "@/lib/auth/parent-links"

export type StaffLinkedStudent = LinkedStudentSummary

const WORKPLACE_DB_ROLES = new Set(["STAFF", "TEACHER", "ADMIN"])

function canWorkplaceLink(role: string): boolean {
  return WORKPLACE_DB_ROLES.has(role) && isParentCapableDbRole(role)
}

/** Persist staff/teacher/admin↔student links on the same ParentStudent + User.linkedStudentIds parents use. */
export async function linkStaffUserToStudent(input: {
  staffUserId: string
  studentExternalId: string
  relationship?: string
}): Promise<{ linkedStudentIds: string[]; studentName: string }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const user = await prisma.user.findUnique({
    where: { id: input.staffUserId },
    select: { role: true },
  })

  if (!user || !canWorkplaceLink(user.role)) {
    throw new Error("Only staff, teacher, or admin accounts can link students this way")
  }

  return linkParentUserToStudent({
    parentUserId: input.staffUserId,
    studentExternalId: input.studentExternalId,
    relationship: input.relationship,
  })
}

export async function getStaffLinkedStudents(
  staffUserId: string
): Promise<StaffLinkedStudent[]> {
  if (!isDatabaseEnabled()) return []

  const user = await prisma.user.findUnique({
    where: { id: staffUserId },
    select: { role: true },
  })

  if (!user || !canWorkplaceLink(user.role)) return []

  return getParentLinkedStudentSummaries(staffUserId)
}
