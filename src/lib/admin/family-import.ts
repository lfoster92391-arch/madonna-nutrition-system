import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { findStudentByExternalId } from "@/lib/db/students"
import { sendEmail } from "@/lib/email"
import { generateTempPassword } from "@/lib/users"
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

export interface FamilyImportResult {
  created: number
  linked: number
  skipped: number
  errors: FamilyImportError[]
  credentials: FamilyImportCredential[]
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
      select: { id: true },
    })
    if (!existing) return candidate
    suffix += 1
    candidate = `${base}${suffix}`
  }
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
}) {
  const loginHint = input.tempPassword
    ? `Username: ${input.username}\nTemporary password: ${input.tempPassword}\nYou will be asked to change your password on first login.`
    : `Username: ${input.username}\nUse the password provided by your school administrator.`

  await sendEmail({
    to: input.email,
    subject: "Welcome to Fuel The Dons Parent Portal",
    body: `Hello ${input.firstName},\n\nYour parent portal account has been created.\n\n${loginHint}\n\nSign in at your school's parent portal URL.`,
    type: "EMAIL_OUTBOX",
    userId: input.userId,
    metadata: { kind: "welcome", username: input.username },
  })
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
  }

  const credentialMap = new Map<string, FamilyImportCredential>()

  for (let index = 0; index < input.rows.length; index++) {
    const row = input.rows[index]!
    const rowNumber = index + 1
    const email = row.parentEmail.trim().toLowerCase()
    const relationship = row.relationship?.trim() || "Guardian"

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
        message: `Email ${email} is already registered as ${existingUser.role.toLowerCase()}`,
      })
      continue
    }

    if (existingUser) {
      const linkedIds = await linkParentToStudent({
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
        await sendWelcomeEmail({
          email,
          firstName: row.parentFirstName.trim(),
          username: existingUser.username,
          userId: existingUser.id,
        })
      }

      continue
    }

    const password = row.password?.trim() || generateTempPassword()
    const passwordHash = await bcrypt.hash(password, 10)
    const username = await resolveUniqueUsername(
      defaultUsername(email, row.parentUsername),
      input.schoolId
    )

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
      await sendWelcomeEmail({
        email,
        firstName: row.parentFirstName.trim(),
        username,
        tempPassword,
        userId: user.id,
      })
    }
  }

  result.credentials = [...credentialMap.values()]
  return result
}
