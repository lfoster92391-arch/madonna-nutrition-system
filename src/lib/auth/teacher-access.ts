import { isAllowedTeacherEmail, TEACHER_ACCESS_DENIED_MESSAGE } from "@/config/teacher-auth"
import { isDatabaseEnabled } from "@/lib/db/config"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/lib/types"

export class TeacherAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TeacherAccessError"
  }
}

export async function assertTeacherUser(userId: string): Promise<{
  id: string
  email: string
  displayName: string
  department: string
  accountBalance: number
}> {
  if (!isDatabaseEnabled()) {
    throw new TeacherAccessError("Teacher access requires a configured database.")
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
    },
  })

  if (!user || user.role !== "TEACHER") {
    throw new TeacherAccessError("Teacher access required")
  }

  if (!isAllowedTeacherEmail(user.email)) {
    throw new TeacherAccessError(TEACHER_ACCESS_DENIED_MESSAGE)
  }

  return {
    id: user.id,
    email: user.email,
    displayName: `${user.firstName} ${user.lastName}`,
    department: user.department ?? "Faculty",
    accountBalance: Number(user.accountBalance),
  }
}

export function portalMatchesTeacherRole(portalRole: string, userRole: UserRole): boolean {
  return portalRole === "teacher" && userRole === "teacher"
}
