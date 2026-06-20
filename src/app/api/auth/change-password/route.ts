import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { changePasswordSchema } from "@/lib/api/validation"
import { badRequest, withDatabase } from "@/lib/api/response"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest("Invalid password change payload", parsed.error.flatten())
    }

    const { userId, currentPassword, newPassword } = parsed.data
    const schoolId = await resolveSchoolId()
    const user = await prisma.user.findFirst({ where: { id: userId, schoolId } })

    if (!user?.passwordHash) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 401 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    })

    return NextResponse.json({ success: true })
  })
  return result instanceof NextResponse ? result : result
}
