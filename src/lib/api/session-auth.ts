import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { forbidden } from "@/lib/api/response"

/** Logged-in user id from AuthProvider session (client sends on mutating requests). */
export const SESSION_USER_HEADER = "x-session-user-id"

/** Shared secret for kiosk/offline sync — set MNMS_API_KEY in Vercel env. */
export const API_KEY_HEADER = "x-api-key"

export function getSessionUserId(request: Request): string | null {
  return request.headers.get(SESSION_USER_HEADER)?.trim() || null
}

export function verifyApiKey(request: Request): boolean {
  const key = request.headers.get(API_KEY_HEADER)?.trim()
  const expected = process.env.MNMS_API_KEY?.trim()
  return Boolean(key && expected && key === expected)
}

export async function requireCashierOrApiKey(request: Request) {
  if (verifyApiKey(request)) {
    const schoolId = await resolveSchoolId()
    return { schoolId, via: "api-key" as const }
  }

  const userId = getSessionUserId(request)
  if (!userId) {
    return { error: forbidden("Cashier session or API key required") } as const
  }

  const schoolId = await resolveSchoolId()
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      schoolId,
      status: "ACTIVE",
      role: { in: ["ADMIN", "CASHIER"] },
    },
  })

  if (!user) {
    return { error: forbidden("Cashier or admin session required") } as const
  }

  return { schoolId, user, via: "session" as const }
}

type DbRole = "ADMIN" | "CASHIER" | "PARENT" | "TEACHER" | "STAFF"

export async function requireMutatingSession(
  request: Request,
  allowedRoles: DbRole[] = ["ADMIN"]
) {
  const userId = getSessionUserId(request)
  if (!userId) {
    return { error: forbidden("Session authentication required") } as const
  }

  const schoolId = await resolveSchoolId()
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      schoolId,
      status: "ACTIVE",
      role: { in: allowedRoles },
    },
  })

  if (!user) {
    return { error: forbidden("Insufficient permissions for this action") } as const
  }

  return { schoolId, user } as const
}
