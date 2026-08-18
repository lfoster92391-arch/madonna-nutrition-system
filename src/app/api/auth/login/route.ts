import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"
import { prisma } from "@/lib/prisma"
import { mapUser } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { findUserByLogin, normalizeUsername, ROLE_LABELS } from "@/lib/users"
import { loginSchema } from "@/lib/api/validation"
import { badRequest, withDatabase } from "@/lib/api/response"
import { isAllowedTeacherEmail, TEACHER_ACCESS_DENIED_MESSAGE } from "@/config/teacher-auth"
import { parentHasLinkedStudents } from "@/lib/auth/parent-links"
import { portalMatchesAccount } from "@/lib/auth/portal-roles"
import { ensureParentRecordForUser } from "@/lib/agreements/service"
import type { UserRole } from "@/lib/types"
import { getClientIp, getUserAgent } from "@/lib/security/client-meta"
import {
  checkLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/security/login-throttle"

function portalMatchesUserRole(
  portalRole: "admin" | "cashier" | "parent" | "staff" | "teacher",
  user: { role: UserRole; email?: string | null; linkedStudentIds?: string[] | null }
): boolean {
  return portalMatchesAccount(portalRole, user)
}

async function rejectFailed(
  request: Request,
  loginId: string,
  portalRole: string,
  reason: string,
  clientMessage: string,
  status: number
) {
  const ip = getClientIp(request)
  const userAgent = getUserAgent(request)
  const result = await recordLoginFailure({
    ip,
    loginId,
    portalRole,
    userAgent,
    reason,
  })
  const headers = new Headers()
  if (result.locked && result.retryAfterSec > 0) {
    headers.set("Retry-After", String(result.retryAfterSec))
  }
  return NextResponse.json(
    {
      success: false,
      error: result.locked
        ? `Too many failed sign-in attempts. Try again in ${result.retryAfterSec} seconds.`
        : clientMessage,
    },
    { status: result.locked ? 429 : status, headers }
  )
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest("Invalid login payload", parsed.error.flatten())
    }

    const { username, password, role } = parsed.data
    const loginId = normalizeUsername(username)
    const ip = getClientIp(request)

    const throttle = checkLoginAllowed(ip, loginId)
    if (!throttle.allowed) {
      return NextResponse.json(
        { success: false, error: throttle.message },
        {
          status: 429,
          headers: { "Retry-After": String(throttle.retryAfterSec) },
        }
      )
    }

    const schoolId = await resolveSchoolId()
    const users = (await prisma.user.findMany({ where: { schoolId } })).map(mapUser)
    const user = findUserByLogin(users, loginId)

    if (!user) {
      return rejectFailed(
        request,
        loginId,
        role,
        "unknown_user",
        "No account found with that username or email.",
        401
      )
    }

    if (user.status === "disabled") {
      return NextResponse.json(
        { success: false, error: "Account disabled. Contact your system administrator." },
        { status: 403 }
      )
    }

    if (!portalMatchesUserRole(role, user)) {
      const roleLabel = ROLE_LABELS[user.role]
      const portalHint =
        role === "admin" && user.role === "parent"
          ? " If this is your administrator account, contact IT or run the admin seed to restore access."
          : ""
      return rejectFailed(
        request,
        loginId,
        role,
        "wrong_portal",
        `This account is registered as ${roleLabel}. Use the ${roleLabel} portal to sign in.${portalHint}`,
        403
      )
    }

    if (role === "teacher" && !isAllowedTeacherEmail(user.email)) {
      return NextResponse.json(
        { success: false, error: TEACHER_ACCESS_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser?.passwordHash) {
      return rejectFailed(
        request,
        loginId,
        role,
        "no_password",
        "Password not configured for this account.",
        401
      )
    }

    const valid = await bcrypt.compare(password, dbUser.passwordHash)
    if (!valid) {
      return rejectFailed(request, loginId, role, "bad_password", "Invalid password.", 401)
    }

    clearLoginFailures(ip, loginId)

    let needsStudentLink = false
    if (role === "parent") {
      await ensureParentRecordForUser(user.id)
      needsStudentLink = !(await parentHasLinkedStudents(user.id))
      if (needsStudentLink) {
        return NextResponse.json({
          success: true,
          mustChangePassword: dbUser.mustChangePassword,
          needsStudentLink: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            displayName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            linkedStudentIds: user.linkedStudentIds ?? [],
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      mustChangePassword: dbUser.mustChangePassword,
      needsStudentLink: false,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        linkedStudentIds: user.linkedStudentIds ?? [],
      },
    })
  })
  return result instanceof NextResponse ? result : result
}
