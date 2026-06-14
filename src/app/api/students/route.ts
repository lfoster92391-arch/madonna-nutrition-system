import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allergiesToCreateInput, mapStudent } from "@/lib/db/mappers"
import { findStudentByExternalId, studentInclude } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { studentSchema } from "@/lib/api/validation"
import { badRequest, dbUnavailableResponse, serverError, withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const students = await prisma.student.findMany({
      where: { schoolId },
      include: studentInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })
    return NextResponse.json(students.map(mapStudent))
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = studentSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid student payload", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const data = parsed.data
      const existing = await findStudentByExternalId(data.id)
      if (existing) {
        return badRequest(`Student ID ${data.id} already exists`)
      }

      const student = await prisma.student.create({
        data: {
          externalId: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          grade: data.grade,
          homeroom: data.homeroom,
          balance: data.balance,
          photo: data.photo,
          dietaryRestrictions: data.dietaryRestrictions ?? [],
          disabled: data.disabled ?? false,
          schoolId,
          allergies: {
            create: allergiesToCreateInput(data.allergies ?? []),
          },
        },
        include: studentInclude,
      })

      return NextResponse.json(mapStudent(student), { status: 201 })
    } catch (error) {
      console.error("POST /api/students", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : dbUnavailableResponse()
}
