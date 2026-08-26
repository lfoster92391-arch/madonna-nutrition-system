import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import {
  findStudentPortalUser,
  upsertStudentPortalAccount,
} from "@/lib/auth/student-accounts"
import { STUDENT_EMAIL_DOMAIN } from "@/config/academic-year"
import type { studentPortalImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type StudentPortalImportRow = z.infer<typeof studentPortalImportRowSchema> & {
  _rowNumber?: number
}

export interface StudentPortalImportError {
  row: number
  message: string
}

export interface StudentPortalImportCredential {
  mdId: string
  email: string
  username: string
  action: "created" | "updated" | "skipped"
  enabled: boolean
  tempPassword?: string
}

export interface StudentPortalImportResult {
  created: number
  updated: number
  skipped: number
  enabled: number
  errors: StudentPortalImportError[]
  credentials: StudentPortalImportCredential[]
}

function resolvePassword(
  rowPassword: string | undefined,
  defaultPassword: string | undefined
): { password: string; fromCsv: boolean } | { error: string } {
  const explicit = rowPassword?.trim()
  if (explicit) {
    if (explicit.length < 8) {
      return { error: "Password must be at least 8 characters" }
    }
    return { password: explicit, fromCsv: true }
  }

  const fallback = defaultPassword?.trim()
  if (!fallback) {
    return {
      error:
        "Password missing for this row. Set a default bulk password (8+ characters) or include a password in the CSV.",
    }
  }
  if (fallback.length < 8) {
    return { error: "Default bulk password must be at least 8 characters" }
  }
  return { password: fallback, fromCsv: false }
}

function normalizeMdId(value: string): string {
  return value.trim()
}

/**
 * Bulk-create or refresh STUDENT portal logins for existing roster students (by MD ID).
 * Optional per-row email/password; default bulk password fills blank password cells.
 * Disabled students are enabled so they can sign in at /login/student.
 */
export async function importStudentPortalRows(input: {
  rows: StudentPortalImportRow[]
  schoolId: string
  performedBy: string
  defaultPassword?: string
}): Promise<StudentPortalImportResult> {
  const result: StudentPortalImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    enabled: 0,
    errors: [],
    credentials: [],
  }

  const school = await prisma.school.findUnique({
    where: { id: input.schoolId },
    select: { slug: true },
  })

  for (let index = 0; index < input.rows.length; index++) {
    const row = input.rows[index]!
    const rowNumber = row._rowNumber ?? index + 1
    const mdId = normalizeMdId(row.mdId || row.externalId || "")
    if (!mdId) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: "MD ID (or externalId) is required" })
      continue
    }

    const passwordResult = resolvePassword(row.password, input.defaultPassword)
    if ("error" in passwordResult) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: passwordResult.error })
      continue
    }

    const student = await prisma.student.findUnique({
      where: {
        schoolId_externalId: { schoolId: input.schoolId, externalId: mdId },
      },
    })

    if (!student) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `No roster student found for MD ID ${mdId}. Import the SIS roster first.`,
      })
      continue
    }

    const csvEmail = row.email?.trim().toLowerCase() || undefined
    if (csvEmail && !csvEmail.includes("@")) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: `Invalid email: ${csvEmail}` })
      continue
    }

    const emailForPortal = csvEmail || student.email?.trim().toLowerCase() || null
    if (!emailForPortal) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `No email on row or roster for ${mdId}. Add email (e.g. …@${STUDENT_EMAIL_DOMAIN}).`,
      })
      continue
    }

    let enabled = false
    const studentUpdates: { disabled?: boolean; email?: string } = {}
    if (student.disabled) {
      studentUpdates.disabled = false
      enabled = true
    }
    if (csvEmail && csvEmail !== (student.email?.trim().toLowerCase() || "")) {
      studentUpdates.email = csvEmail
    }
    if (Object.keys(studentUpdates).length > 0) {
      await prisma.student.update({
        where: { id: student.id },
        data: studentUpdates,
      })
      if (enabled) result.enabled += 1
    }

    const provisioned = await upsertStudentPortalAccount(prisma, {
      schoolId: input.schoolId,
      schoolSlug: school?.slug,
      student: {
        externalId: student.externalId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: emailForPortal,
        disabled: false,
      },
      password: passwordResult.password,
      mustChangePassword: true,
    })

    if (provisioned.action === "skipped") {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `Skipped ${mdId} — a non-student account already uses this username or email`,
      })
      continue
    }

    if (provisioned.action === "created") result.created += 1
    else result.updated += 1

    const portalUser = await findStudentPortalUser(prisma, {
      schoolId: input.schoolId,
      externalId: student.externalId,
      email: emailForPortal,
    })

    await createAuditLog({
      action: provisioned.action === "created" ? "USER_CREATED" : "PASSWORD_RESET",
      entity: "user",
      entityType: "user",
      entityId: portalUser?.id ?? provisioned.username,
      performedBy: input.performedBy,
      newValue: {
        username: provisioned.username,
        email: provisioned.email,
        role: "STUDENT",
        studentExternalId: mdId,
        importSource: "student-portal-csv",
        mustChangePassword: true,
        enabled,
        action: provisioned.action,
      },
    })

    result.credentials.push({
      mdId,
      email: provisioned.email,
      username: provisioned.username,
      action: provisioned.action,
      enabled,
      tempPassword: passwordResult.fromCsv ? undefined : passwordResult.password,
    })
  }

  return result
}
