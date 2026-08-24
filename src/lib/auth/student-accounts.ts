import bcrypt from "bcryptjs"
import type { PrismaClient } from "@prisma/client"
import { STUDENT_EMAIL_DOMAIN } from "@/config/academic-year"
import { normalizeUsername } from "@/lib/users"

const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "FuelTheDons2026!"

function isSchoolStudentEmail(email: string | null | undefined): boolean {
  const trimmed = email?.trim().toLowerCase()
  if (!trimmed) return false
  return trimmed.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)
}

/**
 * Username stays MD ID when available (optional secondary login).
 * School email on the User record is the primary login via findUserByLogin.
 */
function studentUsername(externalId: string, email: string | null | undefined): string {
  const fromId = normalizeUsername(externalId)
  if (fromId) return fromId
  if (isSchoolStudentEmail(email)) {
    return normalizeUsername(email!.split("@")[0] ?? "") || "student"
  }
  const local = email?.split("@")[0] ?? "student"
  return normalizeUsername(local) || "student"
}

function studentEmail(
  externalId: string,
  email: string | null | undefined,
  schoolSlug: string
): string {
  const trimmed = email?.trim().toLowerCase()
  if (trimmed) return trimmed
  return `${normalizeUsername(externalId)}@students.${schoolSlug}.local`
}

/**
 * Ensure a STUDENT portal User exists for a roster Student.
 * Prefer @weirtonmadonna.org school email as the login identity; MD ID is secondary.
 */
export async function upsertStudentPortalAccount(
  prisma: PrismaClient,
  input: {
    schoolId: string
    schoolSlug?: string
    student: {
      externalId: string
      firstName: string
      lastName: string
      email?: string | null
      disabled?: boolean
    }
    password?: string
    mustChangePassword?: boolean
  }
): Promise<{ action: "created" | "updated" | "skipped"; username: string; email: string }> {
  if (input.student.disabled) {
    return {
      action: "skipped",
      username: studentUsername(input.student.externalId, input.student.email),
      email: studentEmail(input.student.externalId, input.student.email, input.schoolSlug ?? "madonna"),
    }
  }

  const email = studentEmail(
    input.student.externalId,
    input.student.email,
    input.schoolSlug ?? "madonna"
  )
  const username = studentUsername(input.student.externalId, input.student.email)
  const passwordHash = await bcrypt.hash(input.password ?? DEFAULT_PASSWORD, 10)
  const mustChangePassword = input.mustChangePassword ?? true

  const existingByUsername = await prisma.user.findUnique({ where: { username } })
  const existingByEmail = await prisma.user.findUnique({ where: { email } })
  const existingByMdId = await prisma.user.findFirst({
    where: {
      schoolId: input.schoolId,
      role: "STUDENT",
      linkedStudentIds: { has: input.student.externalId },
    },
  })
  const existing =
    existingByMdId?.role === "STUDENT"
      ? existingByMdId
      : existingByUsername?.role === "STUDENT"
        ? existingByUsername
        : existingByEmail?.role === "STUDENT"
          ? existingByEmail
          : null

  const data = {
    email,
    username,
    firstName: input.student.firstName,
    lastName: input.student.lastName,
    role: "STUDENT" as const,
    status: "ACTIVE" as const,
    passwordHash,
    mustChangePassword,
    linkedStudentIds: [input.student.externalId],
    schoolId: input.schoolId,
  }

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        ...data,
        passwordHash: existing.passwordHash || passwordHash,
        mustChangePassword: existing.passwordHash
          ? existing.mustChangePassword
          : mustChangePassword,
      },
    })
    return { action: "updated", username, email }
  }

  if (
    (existingByUsername && existingByUsername.role !== "STUDENT") ||
    (existingByEmail && existingByEmail.role !== "STUDENT")
  ) {
    return { action: "skipped", username, email }
  }

  await prisma.user.create({ data })
  return { action: "created", username, email }
}

/** Find the STUDENT portal User linked to a roster MD ID (or matching school email). */
export async function findStudentPortalUser(
  prisma: PrismaClient,
  input: { schoolId: string; externalId: string; email?: string | null }
) {
  const byLink = await prisma.user.findFirst({
    where: {
      schoolId: input.schoolId,
      role: "STUDENT",
      linkedStudentIds: { has: input.externalId },
    },
  })
  if (byLink) return byLink

  const email = input.email?.trim().toLowerCase()
  if (!email) return null
  return prisma.user.findFirst({
    where: {
      schoolId: input.schoolId,
      role: "STUDENT",
      email: { equals: email, mode: "insensitive" },
    },
  })
}
