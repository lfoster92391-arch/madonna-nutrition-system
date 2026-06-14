import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapTransaction } from "@/lib/db/mappers"
import { findStudentByExternalId } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { mealTransactionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = mealTransactionSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid meal transaction", parsed.error.flatten())
      }

      const { studentId, meal, amount } = parsed.data
      const student = await findStudentByExternalId(studentId)
      if (!student || student.disabled) {
        return notFound("Student not found or disabled")
      }

      const schoolId = await resolveSchoolId()
      const balanceAfter = Number(student.balance) - amount

      const [updatedStudent, transaction] = await prisma.$transaction([
        prisma.student.update({
          where: { id: student.id },
          data: { balance: balanceAfter },
        }),
        prisma.transaction.create({
          data: {
            studentId: student.id,
            schoolId,
            mealType: meal,
            amount,
            balanceAfter,
          },
          include: {
            student: { select: { externalId: true, firstName: true, lastName: true } },
          },
        }),
      ])

      void updatedStudent
      return NextResponse.json(mapTransaction(transaction), { status: 201 })
    } catch (error) {
      console.error("POST /api/transactions/meal", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
