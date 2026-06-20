import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import {
  adminBroadcastEmailHtml,
  agreementSignedEmailHtml,
  depositConfirmationEmailHtml,
  lowBalanceEmailHtml,
  welcomeEmailHtml,
} from "@/lib/email/templates"
import type { NotificationType, Prisma } from "@prisma/client"

export interface SendEmailInput {
  to: string
  subject: string
  body: string
  html?: string
  type: NotificationType
  userId?: string
  studentId?: string
  metadata?: Record<string, unknown>
}

export interface SendEmailResult {
  sent: boolean
  stored: boolean
  error?: string
}

export interface EmailConfigStatus {
  enabled: boolean
  resendConfigured: boolean
  from: string
}

const DEFAULT_EMAIL_FROM = "Fuel The Dons <noreply@fuelthedons.com>"

export function getEmailConfigStatus(): EmailConfigStatus {
  return {
    enabled: isEmailEnabled(),
    resendConfigured: isResendConfigured(),
    from: process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM,
  }
}

function isEmailEnabled(): boolean {
  const flag = process.env.EMAIL_ENABLED?.trim().toLowerCase()
  if (flag === "false" || flag === "0" || flag === "off") return false
  return true
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

function parseResendError(status: number, detail: string): string {
  try {
    const parsed = JSON.parse(detail) as { message?: string; name?: string }
    if (parsed.message) return parsed.message
  } catch {
    // Resend sometimes returns plain text
  }
  return detail.trim() || `Resend HTTP ${status}`
}

async function sendViaResend(
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: body,
      ...(html ? { html } : {}),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    const error = parseResendError(res.status, detail)
    console.error("[email] Resend failed:", { status: res.status, to, from, error })
    return { ok: false, error }
  }

  return { ok: true }
}

/** Send email via Resend when configured; always persist to Notification inbox. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const schoolId = await resolveSchoolId()
  let sent = false
  let error: string | undefined

  if (isEmailEnabled() && isResendConfigured()) {
    const result = await sendViaResend(input.to, input.subject, input.body, input.html)
    sent = result.ok
    if (!result.ok) error = result.error
  } else if (!isEmailEnabled()) {
    error = "EMAIL_ENABLED is off — message stored in inbox only"
    console.info("[email] skipped send (disabled):", { to: input.to, subject: input.subject })
  } else {
    error = "RESEND_API_KEY is not set — message stored in inbox only"
    console.info("[email] skipped send (no Resend key):", { to: input.to, subject: input.subject })
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
      metadata: {
        ...(input.metadata ?? {}),
        to: input.to,
        ...(error ? { emailError: error } : {}),
      } as Prisma.InputJsonValue,
      schoolId,
    },
  })

  return { sent, stored: true, error }
}

export async function sendTestEmail(input: { to: string; userId?: string }): Promise<SendEmailResult> {
  const config = getEmailConfigStatus()
  const body = [
    "This is a test email from Fuel The Dons.",
    "",
    `Sent at: ${new Date().toISOString()}`,
    `From: ${config.from}`,
    `Resend configured: ${config.resendConfigured ? "yes" : "no"}`,
    `Email enabled: ${config.enabled ? "yes" : "no"}`,
  ].join("\n")

  return sendEmail({
    to: input.to,
    subject: "Fuel The Dons — Email Test",
    body,
    type: "EMAIL_OUTBOX",
    userId: input.userId,
    metadata: { kind: "test" },
  })
}

export async function sendWelcomeEmail(input: {
  to: string
  firstName: string
  username: string
  tempPassword?: string
  userId: string
  portalUrl?: string
}) {
  const body = input.tempPassword
    ? `Hello ${input.firstName},\n\nUsername: ${input.username}\nTemporary password: ${input.tempPassword}`
    : `Hello ${input.firstName},\n\nUsername: ${input.username}`

  return sendEmail({
    to: input.to,
    subject: "Welcome to Fuel The Dons Parent Portal",
    body,
    html: welcomeEmailHtml(input),
    type: "EMAIL_OUTBOX",
    userId: input.userId,
    metadata: { kind: "welcome", username: input.username },
  })
}

export async function sendAgreementSignedEmail(input: {
  to: string
  parentName: string
  versionLabel: string
  studentNames: string[]
  userId: string
  signatureId: string
}) {
  const body = `Thank you, ${input.parentName}. Your cafeteria agreement (${input.versionLabel}) was signed for ${input.studentNames.join(", ")}.`
  return sendEmail({
    to: input.to,
    subject: "Cafeteria Agreement Signed",
    body,
    html: agreementSignedEmailHtml(input),
    type: "AGREEMENT_SIGNED",
    userId: input.userId,
    metadata: { signatureId: input.signatureId },
  })
}

export async function sendDepositConfirmationEmail(input: {
  to: string
  amount: string
  studentName: string
  balanceAfter: string
  userId: string
  studentId: string
  stripeSessionId?: string
}) {
  const body = `${input.amount} was added to ${input.studentName}'s lunch account. New balance: ${input.balanceAfter}.`
  return sendEmail({
    to: input.to,
    subject: "Deposit Received",
    body,
    html: depositConfirmationEmailHtml(input),
    type: "DEPOSIT_SUCCESS",
    userId: input.userId,
    studentId: input.studentId,
    metadata: { stripeSessionId: input.stripeSessionId },
  })
}

export async function sendLowBalanceEmail(input: {
  to: string
  studentName: string
  balance: string
  userId?: string
  studentId: string
  addFundsUrl?: string
}) {
  const body = `${input.studentName}'s cafeteria balance is low (${input.balance}). Please add funds.`
  return sendEmail({
    to: input.to,
    subject: "Low Lunch Balance Alert",
    body,
    html: lowBalanceEmailHtml(input),
    type: "LOW_BALANCE",
    userId: input.userId,
    studentId: input.studentId,
  })
}

export async function sendAdminBroadcastEmail(input: {
  to: string
  title: string
  body: string
  userId?: string
}) {
  return sendEmail({
    to: input.to,
    subject: input.title,
    body: input.body,
    html: adminBroadcastEmailHtml({ title: input.title, body: input.body }),
    type: "ANNOUNCEMENT",
    userId: input.userId,
    metadata: { kind: "broadcast" },
  })
}
