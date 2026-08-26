import { isDatabaseEnabled } from "@/lib/db/config"
import { prisma } from "@/lib/prisma"

export class StaffAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StaffAccessError"
  }
}

export async function assertStaffUser(userId: string): Promise<{
  id: string
  email: string
  displayName: string
  department: string
  accountBalance: number
  linkedStudentIds: string[]
  photo: string | null
}> {
  if (!isDatabaseEnabled()) {
    throw new StaffAccessError("Staff access requires a configured database.")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      accountBalance: true,
      linkedStudentIds: true,
      photo: true,
    },
  })

  if (!user || user.role !== "STAFF") {
    throw new StaffAccessError("Staff access required")
  }

  return {
    id: user.id,
    email: user.email,
    displayName: `${user.firstName} ${user.lastName}`,
    department: user.department ?? "Staff",
    accountBalance: Number(user.accountBalance),
    linkedStudentIds: user.linkedStudentIds ?? [],
    photo: user.photo ?? null,
  }
}
