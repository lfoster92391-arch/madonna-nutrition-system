const BRAND = {
  navy: "#001E62",
  silver: "#C8CDD7",
  white: "#FFFFFF",
  accent: "#041B52",
}

export interface EmailTemplateInput {
  title: string
  preheader?: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
}

export function renderBrandedEmail(input: EmailTemplateInput): string {
  const ctaBlock =
    input.ctaLabel && input.ctaUrl
      ? `<p style="margin:28px 0 0;text-align:center;">
           <a href="${input.ctaUrl}" style="display:inline-block;background:${BRAND.navy};color:${BRAND.white};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">${input.ctaLabel}</a>
         </p>`
      : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${input.title}</title>
</head>
<body style="margin:0;padding:0;background:#F5F6F8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  ${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${input.preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F6F8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.silver};">
          <tr>
            <td style="background:${BRAND.navy};padding:24px 32px;">
              <p style="margin:0;color:${BRAND.white};font-size:22px;font-weight:700;">Fuel The Dons</p>
              <p style="margin:6px 0 0;color:${BRAND.silver};font-size:13px;">Madonna Nutrition Management</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:${BRAND.accent};">${input.title}</h1>
              ${input.bodyHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#F9FAFB;border-top:1px solid ${BRAND.silver};">
              <p style="margin:0;font-size:12px;color:#64748B;text-align:center;">
                Fuel The Dons · Madonna High School Cafeteria Services
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function welcomeEmailHtml(input: {
  firstName: string
  username: string
  tempPassword?: string
  portalUrl?: string
}) {
  const loginDetails = input.tempPassword
    ? `<p>Username: <strong>${input.username}</strong><br/>Temporary password: <strong>${input.tempPassword}</strong></p>
       <p>You will be asked to change your password on first login.</p>`
    : `<p>Username: <strong>${input.username}</strong></p>
       <p>Use the password provided by your school administrator.</p>`

  return renderBrandedEmail({
    title: "Welcome to the Parent Portal",
    preheader: "Your Fuel The Dons account is ready",
    bodyHtml: `<p>Hello ${input.firstName},</p>
      <p>Your parent portal account has been created for Fuel The Dons cafeteria services.</p>
      ${loginDetails}`,
    ctaLabel: input.portalUrl ? "Sign in" : undefined,
    ctaUrl: input.portalUrl,
  })
}

export function agreementSignedEmailHtml(input: {
  parentName: string
  versionLabel: string
  studentNames: string[]
}) {
  return renderBrandedEmail({
    title: "Cafeteria Agreement Signed",
    preheader: "Confirmation of your signed agreement",
    bodyHtml: `<p>Thank you, ${input.parentName}.</p>
      <p>Your cafeteria agreement (<strong>${input.versionLabel}</strong>) was signed for:</p>
      <ul><li>${input.studentNames.join("</li><li>")}</li></ul>`,
  })
}

export function depositConfirmationEmailHtml(input: {
  amount: string
  studentName: string
  balanceAfter: string
}) {
  return renderBrandedEmail({
    title: "Deposit Received",
    preheader: `${input.amount} added to ${input.studentName}'s account`,
    bodyHtml: `<p><strong>${input.amount}</strong> was added to <strong>${input.studentName}</strong>'s lunch account.</p>
      <p>New balance: <strong>${input.balanceAfter}</strong></p>`,
  })
}

export function lowBalanceEmailHtml(input: {
  studentName: string
  balance: string
  addFundsUrl?: string
}) {
  return renderBrandedEmail({
    title: "Low Lunch Balance",
    preheader: `${input.studentName}'s account needs funds`,
    bodyHtml: `<p><strong>${input.studentName}</strong>'s cafeteria balance is low: <strong>${input.balance}</strong>.</p>
      <p>Please add funds to avoid interruptions at the scan station.</p>`,
    ctaLabel: input.addFundsUrl ? "Add funds" : undefined,
    ctaUrl: input.addFundsUrl,
  })
}

export function adminBroadcastEmailHtml(input: {
  title: string
  body: string
}) {
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("")

  return renderBrandedEmail({
    title: input.title,
    preheader: input.title,
    bodyHtml: paragraphs,
  })
}
