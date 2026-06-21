import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { findStudentByExternalId } from "@/lib/db/students"
import { sendWelcomeEmail as deliverWelcomeEmail } from "@/lib/email"
import { generateTempPassword, PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_USERNAME } from "@/lib/users"
import type { familyImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type FamilyImportRow = z.infer<typeof familyImportRowSchema>

export interface FamilyImportError {
  row: number
  message: string
}

export interface FamilyImportCredential {
  email: string
  username: string
  tempPassword?: string
  studentMdIds: string[]
  created: boolean
  linked: boolean
}

export interface WelcomeEmailFailure {
  email: string
  error: string
}

export interface FamilyImportResult {
  created: number
  linked: number
  skipped: number
  errors: FamilyImportError[]
  credentials: FamilyImportCredential[]
  welcomeEmails: {
    attempted: number
    sent: number
    failed: WelcomeEmailFailure[]
  }
}

function parseSendWelcomeEmail(value: FamilyImportRow["sendWelcomeEmail"]): boolean {
  if (typeof value === "boolean") return value
  if (!value?.trim()) return false
  const normalized = value.trim().toLowerCase()
  return normalized === "yes" || normalized === "y" || normalized === "true" || normalized === "1"
}

function defaultUsername(email: string, override?: string): string {
  const trimmed = override?.trim()
  if (trimmed) return trimmed.toLowerCase()
  const local = email.split("@")[0] ?? "parent"
  return local.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "parent"
}

async function resolveUniqueUsername(base: string, schoolId: string): Promise<string> {
  let candidate = base || "parent"
  let suffix = 0
  while (true) {
    const existing = await prisma.user.findFirst({
      where: { schoolId, username: candidate },
      select: { id: true, role: true },
    })
    if (!existing) return candidate
    if (existing.role === "ADMIN") {
      throw new Error(
        `Username ${candidate} is reserved for the IT administrator account`
      )
    }
    suffix += 1
    candidate = `${base}${suffix}`
  }
}

async function validatePrimaryAdminParentImport(
  email: string,
  parentUsername?: string
): Promise<string | null> {
  const normalizedEmail = email.toLowerCase()
  const requestedUsername = defaultUsername(email, parentUsername)
  const explicitUsername = parentUsername?.trim().toLowerCase()

  const primaryAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
      OR: [{ username: PRIMARY_ADMIN_USERNAME }, { email: PRIMARY_ADMIN_EMAIL }],
    },
    select: { id: true },
  })

  if (!primaryAdmin) return null

  if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
    return `Email ${PRIMARY_ADMIN_EMAIL} is reserved for the IT administrator account and cannot be imported as a parent`
  }

  if (
    requestedUsername === PRIMARY_ADMIN_USERNAME ||
    explicitUsername === PRIMARY_ADMIN_USERNAME
  ) {
    return `Username ${PRIMARY_ADMIN_USERNAME} is reserved for the IT administrator account`
  }

  return null
}

async function ensureStudent(
  row: FamilyImportRow,
  schoolId: string,
  rowNumber: number
): Promise<{ studentId: string; externalId: string } | { error: string }> {
  const externalId = row.studentMdId.trim()
  const existing = await findStudentByExternalId(externalId)
  if (existing) {
    return { studentId: existing.id, externalId: existing.externalId }
  }

  const missingFields: string[] = []
  if (!row.studentFirstName?.trim()) missingFields.push("studentFirstName")
  if (!row.studentLastName?.trim()) missingFields.push("studentLastName")
  if (!row.grade?.trim()) missingFields.push("grade")
  if (row.balance === undefined || Number.isNaN(row.balance)) missingFields.push("balance")

  if (missingFields.length > 0) {
    return {
      error: `Student ${externalId} not found; provide ${missingFields.join(", ")} to create`,
    }
  }

  const student = await prisma.student.create({
    data: {
      externalId,
      firstName: row.studentFirstName!.trim(),
      lastName: row.studentLastName!.trim(),
      grade: row.grade!.trim(),
      balance: row.balance!,
      schoolId,
    },
  })

  await createAuditLog({
    action: "STUDENT_CREATED",
    entity: "student",
    entityType: "student",
    entityId: student.id,
    performedBy: "family-import",
    newValue: { externalId, firstName: student.firstName, lastName: student.lastName },
  })

  return { studentId: student.id, externalId: student.externalId }
}

async function linkParentToStudent(input: {
  parentUserId: string
  parentEmail: string
  parentFirstName: string
  parentLastName: string
  parentPhone?: string
  studentId: string
  studentExternalId: string
  relationship: string
  existingLinkedIds: string[]
}): Promise<string[]> {
  const parentUser = await prisma.user.findUnique({
    where: { id: input.parentUserId },
    select: { role: true },
  })

  if (!parentUser || parentUser.role !== "PARENT") {
    throw new Error("Only parent accounts can be linked through family import")
  }

  const linkedIds = [...new Set([...input.existingLinkedIds, input.studentExternalId])]

  await prisma.user.update({
    where: { id: input.parentUserId },
    data: { linkedStudentIds: linkedIds },
  })

  const parent = await prisma.parent.upsert({
    where: { email: input.parentEmail.toLowerCase() },
    update: {
      name: `${input.parentFirstName} ${input.parentLastName}`,
      phone: input.parentPhone?.trim() || undefined,
    },
    create: {
      email: input.parentEmail.toLowerCase(),
      name: `${input.parentFirstName} ${input.parentLastName}`,
      phone: input.parentPhone?.trim() || undefined,
    },
  })

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parent.id, studentId: input.studentId },
    },
    update: { relationship: input.relationship },
    create: {
      parentId: parent.id,
      studentId: input.studentId,
      relationship: input.relationship,
    },
  })

  return linkedIds
}

async function sendWelcomeEmail(input: {
  email: string
  firstName: string
  username: string
  tempPassword?: string
  userId: string
}): Promise<{ sent: boolean; error?: string }> {
  const result = await deliverWelcomeEmail({
    to: input.email,
    firstName: input.firstName,
    username: input.username,
    tempPassword: input.tempPassword,
    userId: input.userId,
  })
  return { sent: result.sent, error: result.error }
}

export async function importFamilyRows(input: {
  rows: FamilyImportRow[]
  schoolId: string
  performedBy: string
}): Promise<FamilyImportResult> {
  const result: FamilyImportResult = {
    created: 0,
    linked: 0,
    skipped: 0,
    errors: [],
    credentials: [],
    welcomeEmails: { attempted: 0, sent: 0, failed: [] },
  }

  const credentialMap = new Map<string, FamilyImportCredential>()

  for (let index = 0; index < input.rows.length; index++) {
    const row = input.rows[index]!
    const rowNumber = index + 1
    const email = row.parentEmail.trim().toLowerCase()
    const relationship = row.relationship?.trim() || "Guardian"

    const primaryAdminError = await validatePrimaryAdminParentImport(email, row.parentUsername)
    if (primaryAdminError) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: primaryAdminError })
      continue
    }

    const studentResult = await ensureStudent(row, input.schoolId, rowNumber)
    if ("error" in studentResult) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: studentResult.error })
      continue
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser && existingUser.role !== "PARENT") {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `Email ${email} is already registered as ${existingUser.role.toLowerCase()}; admin accounts cannot be linked as parents`,
      })
      continue
    }

    if (
      existingUser &&
      (existingUser.username === PRIMARY_ADMIN_USERNAME ||
        existingUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL)
    ) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `Account ${PRIMARY_ADMIN_USERNAME} is reserved for IT administration and cannot be modified by family import`,
      })
      continue
    }

    if (existingUser) {
      try {
        await linkParentToStudent({
          parentUserId: existingUser.id,
          parentEmail: email,
          parentFirstName: row.parentFirstName.trim(),
          parentLastName: row.parentLastName.trim(),
          parentPhone: row.parentPhone,
          studentId: studentResult.studentId,
          studentExternalId: studentResult.externalId,
          relationship,
          existingLinkedIds: existingUser.linkedStudentIds ?? [],
        })
      } catch (error) {
        result.skipped += 1
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : "Could not link parent account",
        })
        continue
      }

      result.linked += 1

      const existingCred = credentialMap.get(email)
      if (existingCred) {
        existingCred.studentMdIds = [...new Set([...existingCred.studentMdIds, studentResult.externalId])]
        existingCred.linked = true
      } else {
        credentialMap.set(email, {
          email,
          username: existingUser.username,
          studentMdIds: [studentResult.externalId],
          created: false,
          linked: true,
        })
      }

      if (parseSendWelcomeEmail(row.sendWelcomeEmail)) {
        result.welcomeEmails.attempted += 1
        const emailResult = await sendWelcomeEmail({
          email,
          firstName: row.parentFirstName.trim(),
          username: existingUser.username,
          userId: existingUser.id,
        })
        if (emailResult.sent) {
          result.welcomeEmails.sent += 1
        } else {
          result.welcomeEmails.failed.push({
            email,
            error: emailResult.error ?? "Email not sent",
          })
        }
      }

      continue
    }

    const password = row.password?.trim() || generateTempPassword()
    const passwordHash = await bcrypt.hash(password, 10)

    let username
    try {
      username = await resolveUniqueUsername(
        defaultUsername(email, row.parentUsername),
        input.schoolId
      )
    } catch (error) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Reserved username conflict",
      })
      continue
    }

    let user
    try {
      user = await prisma.user.create({
        data: {
          username,
          email,
          firstName: row.parentFirstName.trim(),
          lastName: row.parentLastName.trim(),
          phone: row.parentPhone?.trim() || undefined,
          role: "PARENT",
          passwordHash,
          mustChangePassword: !row.password?.trim(),
          linkedStudentIds: [studentResult.externalId],
          schoolId: input.schoolId,
        },
      })
    } catch (error) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: `Could not create user for ${email}: duplicate email or username`,
      })
      continue
    }

    await linkParentToStudent({
      parentUserId: user.id,
      parentEmail: email,
      parentFirstName: row.parentFirstName.trim(),
      parentLastName: row.parentLastName.trim(),
      parentPhone: row.parentPhone,
      studentId: studentResult.studentId,
      studentExternalId: studentResult.externalId,
      relationship,
      existingLinkedIds: user.linkedStudentIds ?? [],
    })

    await createAuditLog({
      action: "USER_CREATED",
      entity: "user",
      entityType: "user",
      entityId: user.id,
      performedBy: input.performedBy,
      newValue: {
        username: user.username,
        email: user.email,
        role: "parent",
        importSource: "family-csv",
        linkedStudentIds: [studentResult.externalId],
      },
    })

    result.created += 1

    const tempPassword = row.password?.trim() ? undefined : password
    const existingCred = credentialMap.get(email)
    if (existingCred) {
      existingCred.studentMdIds = [...new Set([...existingCred.studentMdIds, studentResult.externalId])]
      existingCred.created = true
      if (tempPassword) existingCred.tempPassword = tempPassword
    } else {
      credentialMap.set(email, {
        email,
        username,
        tempPassword,
        studentMdIds: [studentResult.externalId],
        created: true,
        linked: true,
      })
    }

    if (parseSendWelcomeEmail(row.sendWelcomeEmail)) {
      result.welcomeEmails.attempted += 1
      const emailResult = await sendWelcomeEmail({
        email,
        firstName: row.parentFirstName.trim(),
        username,
        tempPassword,
        userId: user.id,
      })
      if (emailResult.sent) {
        result.welcomeEmails.sent += 1
      } else {
        result.welcomeEmails.failed.push({
          email,
          error: emailResult.error ?? "Email not sent",
        })
      }
    }
  }

  result.credentials = [...credentialMap.values()]
  return result
}
