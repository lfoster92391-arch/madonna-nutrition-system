import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { allergiesToCreateInput, mapStudent } from "@/lib/db/mappers"
import { findStudentByExternalId, studentInclude } from "@/lib/db/students"
import { studentUpdateSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    const { id } = await params
    const student = await findStudentByExternalId(id)
    if (!student) return notFound("Student not found")
    return NextResponse.json(mapStudent(student))
  })
  return result instanceof NextResponse ? result : result
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const parsed = studentUpdateSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid student update", parsed.error.flatten())
      }

      const existing = await findStudentByExternalId(id)
      if (!existing) return notFound("Student not found")

      const data = parsed.data
      const student = await prisma.$transaction(async (tx) => {
        if (data.allergies) {
          await tx.allergy.deleteMany({ where: { studentId: existing.id } })
          if (data.allergies.length > 0) {
            await tx.allergy.createMany({
              data: data.allergies.map((allergy) => ({
                studentId: existing.id,
                name: allergy.name,
                severity: allergiesToCreateInput([allergy])[0]!.severity,
              })),
            })
          }
        }

        return tx.student.update({
          where: { id: existing.id },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            grade: data.grade,
            homeroom: data.homeroom,
            balance: data.balance,
            photo: data.photo,
            dietaryRestrictions: data.dietaryRestrictions,
            disabled: data.disabled,
          },
          include: studentInclude,
        })
      })

      return NextResponse.json(mapStudent(student))
    } catch (error) {
      console.error("PATCH /api/students/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    const { id } = await params
    const existing = await findStudentByExternalId(id)
    if (!existing) return notFound("Student not found")

    await prisma.student.update({
      where: { id: existing.id },
      data: { disabled: true },
    })

    return NextResponse.json({ success: true })
  })
  return result instanceof NextResponse ? result : result
}
