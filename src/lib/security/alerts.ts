import { sendEmail } from "@/lib/email"
import { PRIMARY_SUPPORT_EMAIL } from "@/config/support-contacts"

export function getSecurityAlertEmail(): string {
  return process.env.SECURITY_ALERT_EMAIL?.trim() || PRIMARY_SUPPORT_EMAIL
}

export type SecurityAlertKind =
  | "burst_failed_logins"
  | "admin_password_reset"
  | "admin_new_device_login"
  | "stripe_dispute"

/** Fire-and-forget style security notice to Mrs. Morris. */
export async function sendSecurityAlert(input: {
  kind: SecurityAlertKind
  subject: string
  body: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const to = getSecurityAlertEmail()
  try {
    await sendEmail({
      to,
      subject: `[Security] ${input.subject}`,
      body: [
        input.body,
        "",
        "—",
        "Fuel The Dons security monitor",
        "This is an automated alert. It does not mean the system was breached — investigate and confirm.",
      ].join("\n"),
      type: "EMAIL_OUTBOX",
      metadata: {
        kind: "security_alert",
        alertKind: input.kind,
        ...(input.metadata ?? {}),
      },
    })
  } catch (error) {
    console.error("[security-alert] failed to send", input.kind, error)
  }
}