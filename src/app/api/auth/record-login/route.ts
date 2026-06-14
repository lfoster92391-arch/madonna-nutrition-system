import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { badRequest, notFound, withDatabase } from "@/lib/api/response"
import { z } from "zod"

const schema = z.object({ userId: z.string().min(1) })

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten())

    const schoolId = await resolveSchoolId()
    const user = await prisma.user.findFirst({
      where: { id: parsed.data.userId, schoolId },
    })
    if (!user) return notFound("User not found")

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return NextResponse.json({ success: true })
  })
  return result instanceof NextResponse ? result : result
}
