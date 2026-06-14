import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"
import { prisma } from "@/lib/prisma"
import { mapUser } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { findUserByLogin } from "@/lib/users"
import { loginSchema } from "@/lib/api/validation"
import { badRequest, withDatabase } from "@/lib/api/response"
import { isAllowedTeacherEmail, TEACHER_ACCESS_DENIED_MESSAGE } from "@/config/teacher-auth"
import type { UserRole } from "@/lib/types"

function portalMatchesUserRole(
  portalRole: "admin" | "cashier" | "parent" | "teacher",
  userRole: UserRole
): boolean {
  if (portalRole === "admin") return userRole === "admin"
  if (portalRole === "cashier") return userRole === "cashier"
  if (portalRole === "parent") return userRole === "parent"
  if (portalRole === "teacher") return userRole === "teacher"
  return false
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest("Invalid login payload", parsed.error.flatten())
    }

    const { username, password, role } = parsed.data
    const schoolId = await resolveSchoolId()
    const users = (await prisma.user.findMany({ where: { schoolId } })).map(mapUser)
    const user = findUserByLogin(users, username)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with that username." },
        { status: 401 }
      )
    }

    if (user.status === "disabled") {
      return NextResponse.json(
        { success: false, error: "Account disabled. Contact your system administrator." },
        { status: 403 }
      )
    }

    if (!portalMatchesUserRole(role, user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `This account is registered as ${user.role}. Use the correct portal to sign in.`,
        },
        { status: 403 }
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
      return NextResponse.json(
        { success: false, error: "Password not configured for this account." },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, dbUser.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid password." }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role,
        displayName: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
    })
  })
  return result instanceof NextResponse ? result : result
}
