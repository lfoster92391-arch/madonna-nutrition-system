import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { assertBadgeIdAvailable } from "@/lib/db/users"
import { toDbUserRole } from "@/lib/db/mappers"
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_USERNAME, normalizeUsername } from "@/lib/users"
import type { staffImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type StaffImportRow = z.infer<typeof staffImportRowSchema> & { _rowNumber?: number }

export interface StaffImportError {
  row: number
  message: string
}

export interface StaffImportCredential {
  email: string
  username: string
  role: string
  department?: string
  tempPassword?: string
  created: boolean
}

export interface StaffImportResult {
  created: number
  skipped: number
  errors: StaffImportError[]
  credentials: StaffImportCredential[]
}

function defaultUsername(email: string, override?: string): string {
  const trimmed = override?.trim()
  if (trimmed) return normalizeUsername(trimmed)
  const local = email.split("@")[0] ?? "staff"
  return local.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "staff"
}

async function resolveUniqueUsername(base: string, schoolId: string): Promise<string> {
  let candidate = base || "staff"
  let suffix = 0
  while (true) {
    const existing = await prisma.user.findFirst({
      where: { schoolId, username: candidate },
      select: { id: true, role: true },
    })
    if (!existing) return candidate
    if (existing.role === "ADMIN" && candidate === PRIMARY_ADMIN_USERNAME) {
      throw new Error(
        `Username ${candidate} is reserved for the IT administrator account`
      )
    }
    suffix += 1
    candidate = `${base}${suffix}`
  }
}

function validatePrimaryAdminStaffImport(
  email: string,
  username: string
): string | null {
  const normalizedEmail = email.toLowerCase()

  if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
    return `Email ${PRIMARY_ADMIN_EMAIL} is reserved for the IT administrator account`
  }

  if (username === PRIMARY_ADMIN_USERNAME) {
    return `Username ${PRIMARY_ADMIN_USERNAME} is reserved for the IT administrator account`
  }

  return null
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
    return { error: "Password required; set a default bulk password or include a password column" }
  }
  if (fallback.length < 8) {
    return { error: "Default bulk password must be at least 8 characters" }
  }
  return { password: fallback, fromCsv: false }
}

export async function importStaffRows(input: {
  rows: StaffImportRow[]
  schoolId: string
  performedBy: string
  defaultPassword?: string
}): Promise<StaffImportResult> {
  const result: StaffImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
    credentials: [],
  }

  for (let index = 0; index < input.rows.length; index++) {
    const row = input.rows[index]!
    const rowNumber = row._rowNumber ?? index + 1
    const email = row.email.trim().toLowerCase()
    const derivedUsername = defaultUsername(email, row.username)
    const primaryAdminError = validatePrimaryAdminStaffImport(email, derivedUsername)
    if (primaryAdminError) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: primaryAdminError })
      continue
    }

    const passwordResult = resolvePassword(row.password, input.defaultPassword)
    if ("error" in passwordResult) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: passwordResult.error })
      continue
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `Email ${email} is already registered`,
      })
      continue
    }

    const badgeId = row.badgeId?.trim() || null
    const badgeConflict = await assertBadgeIdAvailable(badgeId, input.schoolId)
    if (badgeConflict) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: badgeConflict })
      continue
    }

    let username: string
    try {
      username = await resolveUniqueUsername(derivedUsername, input.schoolId)
    } catch (error) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Reserved username conflict",
      })
      continue
    }

    const passwordHash = await bcrypt.hash(passwordResult.password, 10)

    let user
    try {
      user = await prisma.user.create({
        data: {
          username,
          email,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          phone: row.phone?.trim() || undefined,
          role: toDbUserRole(row.role),
          department: row.department?.trim() || undefined,
          badgeId,
          passwordHash,
          mustChangePassword: true,
          linkedStudentIds: [],
          schoolId: input.schoolId,
        },
      })
    } catch {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `Could not create user for ${email}: duplicate email or username`,
      })
      continue
    }

    await createAuditLog({
      action: "USER_CREATED",
      entity: "user",
      entityType: "user",
      entityId: user.id,
      performedBy: input.performedBy,
      newValue: {
        username: user.username,
        email: user.email,
        role: row.role,
        department: row.department?.trim() || undefined,
        importSource: "staff-csv",
        mustChangePassword: true,
      },
    })

    result.created += 1
    result.credentials.push({
      email,
      username,
      role: row.role,
      department: row.department?.trim() || undefined,
      tempPassword: passwordResult.fromCsv ? undefined : passwordResult.password,
      created: true,
    })
  }

  return result
}
