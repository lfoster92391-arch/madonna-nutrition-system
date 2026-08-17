import { prisma } from "@/lib/prisma"
import { getSeniorGraduationYear } from "@/config/academic-year"
import { resolveGradeFromEmail } from "@/lib/students/grade-from-email"
import { createAuditLog } from "@/lib/db/audit"

export interface StudentGradeRefreshResult {
  scanned: number
  gradesUpdated: number
  archived: number
  reactivated: number
  skippedNoEmail: number
  skippedUnparseable: number
  unchanged: number
  seniorGraduationYear: number
  details: Array<{
    mdId: string
    email: string | null
    action: "grade_updated" | "archived" | "reactivated" | "unchanged" | "skipped"
    grade?: string
    message?: string
  }>
}

/**
 * Recompute grade from student email and archive past graduates.
 * Safe to run on import and via admin refresh / scheduled job.
 */
export async function refreshStudentGradesFromEmail(input: {
  schoolId: string
  performedBy: string
  /** Limit to specific internal student ids when provided. */
  studentIds?: string[]
  now?: Date
}): Promise<StudentGradeRefreshResult> {
  const now = input.now ?? new Date()
  const seniorGraduationYear = getSeniorGraduationYear(now)

  const students = await prisma.student.findMany({
    where: {
      schoolId: input.schoolId,
      ...(input.studentIds ? { id: { in: input.studentIds } } : {}),
    },
    select: {
      id: true,
      externalId: true,
      email: true,
      grade: true,
      disabled: true,
      badgeStatus: true,
    },
  })

  const result: StudentGradeRefreshResult = {
    scanned: students.length,
    gradesUpdated: 0,
    archived: 0,
    reactivated: 0,
    skippedNoEmail: 0,
    skippedUnparseable: 0,
    unchanged: 0,
    seniorGraduationYear,
    details: [],
  }

  for (const student of students) {
    if (!student.email?.trim()) {
      result.skippedNoEmail += 1
      result.details.push({
        mdId: student.externalId,
        email: student.email,
        action: "skipped",
        message: "No email on file",
      })
      continue
    }

    const resolved = resolveGradeFromEmail(student.email, now)

    if (resolved.status === "unparseable") {
      result.skippedUnparseable += 1
      result.details.push({
        mdId: student.externalId,
        email: student.email,
        action: "skipped",
        message: resolved.message,
      })
      continue
    }

    if (resolved.status === "graduated") {
      if (!student.disabled) {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            disabled: true,
            badgeStatus: "INACTIVE",
          },
        })
        result.archived += 1
        result.details.push({
          mdId: student.externalId,
          email: student.email,
          action: "archived",
          message: resolved.message,
        })
      } else {
        result.unchanged += 1
        result.details.push({
          mdId: student.externalId,
          email: student.email,
          action: "unchanged",
          message: "Already archived graduate",
        })
      }
      continue
    }

    const nextGrade = resolved.grade!
    const wasDisabled = student.disabled
    const gradeChanged = student.grade !== nextGrade

    if (!gradeChanged && !wasDisabled) {
      result.unchanged += 1
      result.details.push({
        mdId: student.externalId,
        email: student.email,
        action: "unchanged",
        grade: nextGrade,
      })
      continue
    }

    await prisma.student.update({
      where: { id: student.id },
      data: {
        grade: nextGrade,
        disabled: false,
        // Restore inactive graduates who reappear as enrolled; leave PENDING alone.
        ...(wasDisabled && student.badgeStatus === "INACTIVE"
          ? { badgeStatus: "ACTIVE" }
          : {}),
      },
    })

    if (wasDisabled) {
      result.reactivated += 1
      result.details.push({
        mdId: student.externalId,
        email: student.email,
        action: "reactivated",
        grade: nextGrade,
      })
    } else {
      result.gradesUpdated += 1
      result.details.push({
        mdId: student.externalId,
        email: student.email,
        action: "grade_updated",
        grade: nextGrade,
      })
    }
  }

  await createAuditLog({
    action: "STUDENT_GRADES_REFRESHED",
    entity: "student",
    entityType: "student",
    entityId: input.schoolId,
    performedBy: input.performedBy,
    newValue: {
      scanned: result.scanned,
      gradesUpdated: result.gradesUpdated,
      archived: result.archived,
      reactivated: result.reactivated,
      seniorGraduationYear: result.seniorGraduationYear,
    },
  })

  return result
}
