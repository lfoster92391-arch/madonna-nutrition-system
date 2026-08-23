import bcrypt from "bcryptjs"
import type { PrismaClient } from "@prisma/client"
import { normalizeUsername } from "@/lib/users"

const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "FuelTheDons2026!"

function studentUsername(externalId: string, email: string | null | undefined): string {
  const fromId = normalizeUsername(externalId)
  if (fromId) return fromId
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
 * Username defaults to MD ID (externalId); password is the school default temp password.
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

  const username = studentUsername(input.student.externalId, input.student.email)
  const email = studentEmail(
    input.student.externalId,
    input.student.email,
    input.schoolSlug ?? "madonna"
  )
  const passwordHash = await bcrypt.hash(input.password ?? DEFAULT_PASSWORD, 10)
  const mustChangePassword = input.mustChangePassword ?? true

  const existingByUsername = await prisma.user.findUnique({ where: { username } })
  const existingByEmail = await prisma.user.findUnique({ where: { email } })
  const existing =
    existingByUsername?.role === "STUDENT"
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
        // Keep existing password unless explicitly reprovisioning.
        passwordHash: existing.passwordHash || passwordHash,
        mustChangePassword: existing.passwordHash
          ? existing.mustChangePassword
          : mustChangePassword,
      },
    })
    return { action: "updated", username, email }
  }

  // Do not overwrite non-student accounts that already use this email/username.
  if (existingByUsername || existingByEmail) {
    return { action: "skipped", username, email }
  }

  await prisma.user.create({ data })
  return { action: "created", username, email }
}
