import type { PrismaClient, UserRole } from "@prisma/client"
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_USERNAME, normalizeUsername } from "../users"

export type StaffParentWorkplaceRole = "ADMIN" | "STAFF"

export type StaffParentAccountSpec = {
  email: string
  username: string
  firstName: string
  lastName: string
  /** ADMIN only for Dalfol and Heckathorn. Everyone else is STAFF (or existing TEACHER). */
  workplaceRole: StaffParentWorkplaceRole
}

export const STAFF_PARENT_ACCOUNTS: StaffParentAccountSpec[] = [
  {
    email: "jdalfol@weirtonmadonna.org",
    username: "jdalfol",
    firstName: "J",
    lastName: "Dalfol",
    workplaceRole: "ADMIN",
  },
  {
    email: "jheckathorn@weirtonmadonna.org",
    username: "jheckathorn",
    firstName: "J",
    lastName: "Heckathorn",
    workplaceRole: "ADMIN",
  },
  {
    email: "sobrien@weirtonmadonna.org",
    username: "sobrien",
    firstName: "S",
    lastName: "O'Brien",
    workplaceRole: "STAFF",
  },
  {
    email: "blauttamus@weirtonmadonna.org",
    username: "blauttamus",
    firstName: "B",
    lastName: "Lauttamus",
    workplaceRole: "STAFF",
  },
  {
    email: "ahaught@weirtonmadonna.org",
    username: "ahaught",
    firstName: "A",
    lastName: "Haught",
    workplaceRole: "STAFF",
  },
]

export type StaffParentUpsertResult = {
  email: string
  username: string
  role: UserRole
  action: "created" | "updated"
  id: string
}

function isProtectedAdmin(username: string, email: string): boolean {
  return (
    normalizeUsername(username) === PRIMARY_ADMIN_USERNAME ||
    email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
  )
}

function resolveWorkplaceRole(
  existing: UserRole | undefined,
  desired: StaffParentWorkplaceRole
): UserRole {
  if (desired === "ADMIN") return "ADMIN"
  if (existing === "TEACHER") return "TEACHER"
  return "STAFF"
}

async function usernameTakenByOther(
  prisma: PrismaClient,
  username: string,
  keepUserId?: string
): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })
  if (!row) return false
  return row.id !== keepUserId
}

/**
 * Idempotent: create or update the five parent+workplace accounts.
 * Never duplicates users, never overwrites passwords or linked students,
 * never touches itlisa / lisamorris.
 */
export async function upsertStaffParentAccounts(
  prisma: PrismaClient,
  schoolId: string
): Promise<StaffParentUpsertResult[]> {
  const results: StaffParentUpsertResult[] = []

  for (const spec of STAFF_PARENT_ACCOUNTS) {
    const email = spec.email.trim().toLowerCase()
    const desiredUsername = normalizeUsername(spec.username)

    const existingByEmail = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })
    const existingByUsername = await prisma.user.findUnique({
      where: { username: desiredUsername },
    })

    const existing =
      existingByEmail ??
      (existingByUsername && existingByUsername.email.toLowerCase() === email
        ? existingByUsername
        : null)

    if (existing && isProtectedAdmin(existing.username, existing.email)) {
      continue
    }
    if (existingByUsername && existingByUsername.id !== existing?.id) {
      // Desired username belongs to someone else — keep that user alone.
    }

    const role = resolveWorkplaceRole(existing?.role, spec.workplaceRole)
    const usernameAvailable =
      !existing || !(await usernameTakenByOther(prisma, desiredUsername, existing.id))
    const username = usernameAvailable
      ? desiredUsername
      : existing
        ? existing.username
        : `${desiredUsername}1`

    const displayFirst = existing?.firstName?.trim() || spec.firstName
    const displayLast = existing?.lastName?.trim() || spec.lastName

    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          email,
          username,
          firstName: displayFirst,
          lastName: displayLast,
          role,
          status: "ACTIVE",
          schoolId,
        },
      })
      await prisma.parent.upsert({
        where: { email },
        update: { name: `${displayFirst} ${displayLast}`.trim() },
        create: { email, name: `${displayFirst} ${displayLast}`.trim() },
      })
      results.push({
        email,
        username: updated.username,
        role: updated.role,
        action: "updated",
        id: updated.id,
      })
      continue
    }

    const created = await prisma.user.create({
      data: {
        email,
        username,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role,
        status: "ACTIVE",
        schoolId,
        linkedStudentIds: [],
        mustChangePassword: true,
        passwordHash: null,
      },
    })
    await prisma.parent.upsert({
      where: { email },
      update: { name: `${spec.firstName} ${spec.lastName}`.trim() },
      create: { email, name: `${spec.firstName} ${spec.lastName}`.trim() },
    })
    results.push({
      email,
      username: created.username,
      role: created.role,
      action: "created",
      id: created.id,
    })
  }

  return results
}
