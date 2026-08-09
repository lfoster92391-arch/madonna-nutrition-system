import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { createAuditLog } from "@/lib/db/audit"
import { badRequest, notFound, withDatabase } from "@/lib/api/response"
import { z } from "zod"
import {
  deviceFingerprint,
  getClientIp,
  getUserAgent,
} from "@/lib/security/client-meta"
import { sendSecurityAlert } from "@/lib/security/alerts"

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

    const ip = getClientIp(request)
    const userAgent = getUserAgent(request)
    const fingerprint = deviceFingerprint(ip, userAgent)

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await createAuditLog({
      action: "LOGIN_SUCCESS",
      entity: "auth",
      entityType: "auth",
      entityId: user.id,
      performedBy: user.id,
      metadata: {
        ip,
        userAgent,
        fingerprint,
        role: user.role,
        username: user.username,
      },
    })

    if (user.role === "ADMIN") {
      const prior = await prisma.auditLog.findMany({
        where: {
          schoolId,
          action: "LOGIN_SUCCESS",
          entityId: user.id,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { metadata: true },
      })
      // Current login is already written; look at older ones for known fingerprints.
      const known = new Set(
        prior
          .slice(1)
          .map((row) => (row.metadata as { fingerprint?: string } | null)?.fingerprint)
          .filter((v): v is string => Boolean(v))
      )
      const isFirstLogin = prior.length <= 1
      if (!isFirstLogin && known.size > 0 && !known.has(fingerprint)) {
        void sendSecurityAlert({
          kind: "admin_new_device_login",
          subject: `Admin login from new device (${user.username})`,
          body: [
            "An administrator signed in from a device/IP fingerprint not seen recently.",
            "",
            `Admin: ${user.firstName} ${user.lastName} (${user.username})`,
            `Email: ${user.email}`,
            `IP: ${ip}`,
            `User-Agent: ${userAgent}`,
            `Fingerprint: ${fingerprint}`,
            "",
            "If this was expected, no action is needed. If not, reset the password and review the audit log.",
          ].join("\n"),
          metadata: { userId: user.id, username: user.username, ip, fingerprint },
        })
      }
    }

    return NextResponse.json({ success: true })
  })
  return result instanceof NextResponse ? result : result
}
