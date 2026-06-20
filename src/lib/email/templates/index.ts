export {
  BRAND,
  BRAND_LOGO_URL,
  PARENT_PORTAL_URL,
  renderBrandedEmail,
  type EmailTemplateInput,
} from "@/lib/email/templates/base"

export {
  welcomeEmailHtml,
  welcomeEmailText,
  type WelcomeEmailInput,
} from "@/lib/email/templates/welcome"

export {
  agreementSignedEmailHtml,
  agreementSignedEmailText,
  type AgreementSignedEmailInput,
} from "@/lib/email/templates/agreement-signed"

export {
  depositConfirmationEmailHtml,
  depositConfirmationEmailText,
  type DepositReceivedEmailInput,
} from "@/lib/email/templates/deposit-received"

import { PARENT_PORTAL_URL, renderBrandedEmail } from "@/lib/email/templates/base"

export function lowBalanceEmailHtml(input: {
  studentName: string
  balance: string
  addFundsUrl?: string
}) {
  return renderBrandedEmail({
    title: "Low Lunch Balance",
    preheader: `${input.studentName}'s account needs funds`,
    bodyHtml: `<p style="margin:0 0 12px;"><strong>${input.studentName}</strong>'s cafeteria balance is low: <strong>${input.balance}</strong>.</p>
      <p style="margin:0;color:#475569;">Please add funds to avoid interruptions at the scan station.</p>`,
    ctaLabel: input.addFundsUrl ? "Add funds" : "View account",
    ctaUrl: input.addFundsUrl ?? PARENT_PORTAL_URL,
  })
}

export function adminBroadcastEmailHtml(input: {
  title: string
  body: string
}) {
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("")

  return renderBrandedEmail({
    title: input.title,
    preheader: input.title,
    bodyHtml: paragraphs,
  })
}
