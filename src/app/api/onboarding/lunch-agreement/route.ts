import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { resolveSchoolId } from "@/lib/db/school"
import { findStudentByExternalId } from "@/lib/db/students"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  studentId: z.string().min(1),
  parentEmail: z.string().email(),
  parentName: z.string().min(2),
  acceptedTerms: z.literal(true),
  signatureData: z.string().min(2),
})

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = schema.safeParse(body)
      if (!parsed.success) return badRequest("Invalid lunch agreement payload", parsed.error.flatten())
      const schoolId = await resolveSchoolId()
      const student = await findStudentByExternalId(parsed.data.studentId)
      if (!student) return notFound("Student not found")
      const parent = await prisma.parent.upsert({
        where: { email: parsed.data.parentEmail.toLowerCase() },
        update: { name: parsed.data.parentName },
        create: { email: parsed.data.parentEmail.toLowerCase(), name: parsed.data.parentName },
      })
      const agreement = await prisma.lunchAgreement.upsert({
        where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
        update: {
          acceptedTerms: true,
          signatureData: parsed.data.signatureData,
          signedAt: new Date(),
          status: "SIGNED",
        },
        create: {
          parentId: parent.id,
          studentId: student.id,
          schoolId,
          acceptedTerms: true,
          signatureData: parsed.data.signatureData,
          signedAt: new Date(),
          status: "SIGNED",
        },
      })
      return NextResponse.json(
        {
          id: agreement.id,
          status: agreement.status.toLowerCase(),
          signedAt: agreement.signedAt?.toISOString() ?? null,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error("POST /api/onboarding/lunch-agreement", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
