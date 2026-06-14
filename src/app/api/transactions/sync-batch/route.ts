import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { findStudentByExternalId } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { syncBatchSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = syncBatchSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid sync batch payload", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const sorted = [...parsed.data.transactions].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      let synced = 0
      let skipped = 0
      const failedIds: string[] = []
      const studentIds = new Set(sorted.map((item) => item.studentId))

      for (const item of sorted) {
        const existing = await prisma.transaction.findUnique({
          where: { clientTransactionId: item.clientTxId },
        })
        if (existing) {
          skipped++
          continue
        }

        const student = await findStudentByExternalId(item.studentId)
        if (!student || student.disabled) {
          failedIds.push(item.clientTxId)
          continue
        }

        const balanceBefore = Number(student.balance)
        const balanceAfter = balanceBefore - item.amount

        try {
          await prisma.$transaction(async (tx) => {
            await tx.student.update({
              where: { id: student.id },
              data: { balance: balanceAfter },
            })
            await tx.transaction.create({
              data: {
                studentId: student.id,
                schoolId,
                processedByUserId: null,
                mealType: item.mealType,
                amount: item.amount,
                balanceAfter,
                clientTransactionId: item.clientTxId,
                createdAt: new Date(item.timestamp),
              },
            })
          })

          if (balanceAfter < 0) {
            await createAuditLog({
              action: "offline_overdraft",
              entity: "student",
              entityType: "student",
              entityId: student.id,
              performedBy: item.processedByName ?? "Station",
              reason: "Offline kiosk meal synced with insufficient funds",
              previousValue: { balance: balanceBefore },
              newValue: { balance: balanceAfter },
              metadata: {
                clientTxId: item.clientTxId,
                studentExternalId: item.studentId,
                mealType: item.mealType,
                amount: item.amount,
                deviceId: item.deviceId,
                timestamp: item.timestamp,
              },
            })
          }

          synced++
        } catch (error) {
          console.error("sync-batch item failed:", item.clientTxId, error)
          failedIds.push(item.clientTxId)
        }
      }

      const balances: Record<string, number> = {}
      for (const externalId of studentIds) {
        const student = await findStudentByExternalId(externalId)
        if (student) {
          balances[externalId] = Number(student.balance)
        }
      }

      return NextResponse.json({ synced, skipped, failedIds, balances })
    } catch (error) {
      console.error("POST /api/transactions/sync-batch", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
