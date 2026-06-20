import { PARENT_PORTAL_URL, renderBrandedEmail } from "@/lib/email/templates/base"

export interface WelcomeEmailInput {
  firstName: string
  username: string
  tempPassword?: string
  portalUrl?: string
}

export function welcomeEmailHtml(input: WelcomeEmailInput): string {
  const portalUrl = input.portalUrl ?? PARENT_PORTAL_URL

  const loginDetails = input.tempPassword
    ? `<p style="margin:0 0 12px;">Username: <strong>${input.username}</strong><br/>Temporary password: <strong>${input.tempPassword}</strong></p>
       <p style="margin:0 0 12px;color:#475569;">You will be asked to change your password on first login.</p>`
    : `<p style="margin:0 0 12px;">Username: <strong>${input.username}</strong></p>
       <p style="margin:0 0 12px;color:#475569;">Use the password provided by your school administrator.</p>`

  return renderBrandedEmail({
    title: "Welcome to the Parent Portal",
    preheader: "Your Fuel The Dons account is ready",
    bodyHtml: `<p style="margin:0 0 12px;">Hello ${input.firstName},</p>
      <p style="margin:0 0 12px;">Your parent portal account has been created for Fuel The Dons cafeteria services. Sign in to view balances, add funds, and manage meal accounts.</p>
      ${loginDetails}`,
    ctaLabel: "Sign in to Parent Portal",
    ctaUrl: portalUrl,
  })
}

export function welcomeEmailText(input: WelcomeEmailInput): string {
  const portalUrl = input.portalUrl ?? PARENT_PORTAL_URL
  const lines = [
    `Hello ${input.firstName},`,
    "",
    "Welcome to Fuel The Dons Parent Portal.",
    "",
    "Your parent portal account has been created for Fuel The Dons cafeteria services.",
    "",
    `Username: ${input.username}`,
  ]

  if (input.tempPassword) {
    lines.push(`Temporary password: ${input.tempPassword}`, "", "You will be asked to change your password on first login.")
  } else {
    lines.push("", "Use the password provided by your school administrator.")
  }

  lines.push("", `Sign in at: ${portalUrl}`, "", "— Fuel The Dons · Madonna High School Cafeteria Services")

  return lines.join("\n")
}
