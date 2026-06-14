import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { mapAuditLog } from "@/lib/db/mappers"
import type { AuditLogEntry } from "@/lib/types"

export interface CreateAuditLogInput {
  action: string
  entity: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  performedBy?: string
  performedAt?: Date
  previousValue?: Record<string, unknown> | string
  newValue?: Record<string, unknown> | string
  reason?: string
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogEntry> {
  const schoolId = await resolveSchoolId()
  const log = await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityType: input.entityType ?? input.entity,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      performedBy: input.performedBy,
      performedAt: input.performedAt ?? new Date(),
      previousValue: input.previousValue as Prisma.InputJsonValue | undefined,
      newValue: input.newValue as Prisma.InputJsonValue | undefined,
      reason: input.reason,
      schoolId,
    },
  })
  return mapAuditLog(log)
}

export async function listAuditLogs(limit = 200): Promise<AuditLogEntry[]> {
  const schoolId = await resolveSchoolId()
  const logs = await prisma.auditLog.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return logs.map(mapAuditLog)
}
