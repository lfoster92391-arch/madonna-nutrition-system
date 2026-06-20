import { PARENT_PORTAL_URL, renderBrandedEmail } from "@/lib/email/templates/base"

export interface DepositReceivedEmailInput {
  amount: string
  studentName: string
  balanceAfter: string
}

export function depositConfirmationEmailHtml(input: DepositReceivedEmailInput): string {
  return renderBrandedEmail({
    title: "Deposit Received",
    preheader: `${input.amount} added to ${input.studentName}'s account`,
    bodyHtml: `<p style="margin:0 0 12px;"><strong>${input.amount}</strong> was added to <strong>${input.studentName}</strong>'s lunch account.</p>
      <p style="margin:0 0 12px;">New balance: <strong>${input.balanceAfter}</strong></p>
      <p style="margin:0;color:#475569;">Thank you for supporting your student's cafeteria account.</p>`,
    ctaLabel: "View account",
    ctaUrl: PARENT_PORTAL_URL,
  })
}

export function depositConfirmationEmailText(input: DepositReceivedEmailInput): string {
  return [
    "Deposit Received",
    "",
    `${input.amount} was added to ${input.studentName}'s lunch account.`,
    `New balance: ${input.balanceAfter}`,
    "",
    `View your account at: ${PARENT_PORTAL_URL}`,
    "",
    "— Fuel The Dons · Madonna High School Cafeteria Services",
  ].join("\n")
}
