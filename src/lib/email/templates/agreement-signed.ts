import { renderBrandedEmail } from "@/lib/email/templates/base"

export interface AgreementSignedEmailInput {
  parentName: string
  versionLabel: string
  studentNames: string[]
}

export function agreementSignedEmailHtml(input: AgreementSignedEmailInput): string {
  return renderBrandedEmail({
    title: "Cafeteria Agreement Signed",
    preheader: "Confirmation of your signed agreement",
    bodyHtml: `<p style="margin:0 0 12px;">Thank you, ${input.parentName}.</p>
      <p style="margin:0 0 12px;">Your cafeteria agreement (<strong>${input.versionLabel}</strong>) was signed for:</p>
      <ul style="margin:0 0 12px;padding-left:20px;">${input.studentNames.map((name) => `<li style="margin:4px 0;">${name}</li>`).join("")}</ul>
      <p style="margin:0;color:#475569;">A copy is available in your parent portal account.</p>`,
  })
}

export function agreementSignedEmailText(input: AgreementSignedEmailInput): string {
  return [
    `Thank you, ${input.parentName}.`,
    "",
    `Your cafeteria agreement (${input.versionLabel}) was signed for:`,
    ...input.studentNames.map((name) => `  • ${name}`),
    "",
    "A copy is available in your parent portal account.",
    "",
    "— Fuel The Dons · Madonna High School Cafeteria Services",
  ].join("\n")
}
