import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import type { NotificationType, Prisma } from "@prisma/client"

export interface SendEmailInput {
  to: string
  subject: string
  body: string
  type: NotificationType
  userId?: string
  studentId?: string
  metadata?: Record<string, unknown>
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

async function sendViaResend(to: string, subject: string, body: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim() ?? "Fuel The Dons <noreply@fuel-thedons.org>"
  if (!apiKey) return false

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text: body }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    console.error("[email] Resend failed:", res.status, detail)
    return false
  }

  return true
}

/** Send email via Resend when configured; otherwise log and persist to Notification inbox. */
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; stored: boolean }> {
  const schoolId = await resolveSchoolId()
  let sent = false

  if (isResendConfigured()) {
    sent = await sendViaResend(input.to, input.subject, input.body)
  } else {
    console.info("[email] stub (no RESEND_API_KEY):", {
      to: input.to,
      subject: input.subject,
    })
  }

  await prisma.notification.create({
    data: {
      type: input.type,
      title: input.subject,
      message: input.body,
      channel: "EMAIL",
      emailSent: sent,
      read: false,
      userId: input.userId ?? undefined,
      studentId: input.studentId ?? undefined,
      metadata: (input.metadata ?? { to: input.to }) as Prisma.InputJsonValue,
      schoolId,
    },
  })

  return { sent, stored: true }
}
