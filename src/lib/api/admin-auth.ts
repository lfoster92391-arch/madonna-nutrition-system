import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"

export function forbidden(message = "Admin access required") {
  return NextResponse.json({ error: message }, { status: 403 })
}

export async function requireAdmin(adminUserId: string | null | undefined) {
  if (!adminUserId?.trim()) {
    return { error: forbidden("Admin authentication required") } as const
  }

  const schoolId = await resolveSchoolId()
  const admin = await prisma.user.findFirst({
    where: {
      id: adminUserId,
      schoolId,
      role: "ADMIN",
      status: "ACTIVE",
    },
  })

  if (!admin) {
    return { error: forbidden("Admin access required") } as const
  }

  return { admin, schoolId } as const
}
