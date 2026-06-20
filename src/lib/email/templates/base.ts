/** Absolute URL required — email clients cannot load relative or local paths. */
export const BRAND_LOGO_URL = "https://www.fuelthedons.com/brand-logo.png"

export const PARENT_PORTAL_URL = "https://www.fuelthedons.com/login/parent"

export const BRAND = {
  navy: "#0A1E3F",
  accent: "#041B52",
  silver: "#C8CDD7",
  white: "#FFFFFF",
  muted: "#64748B",
  background: "#F5F6F8",
} as const

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
           <a href="${input.ctaUrl}" style="display:inline-block;background:${BRAND.navy};color:${BRAND.white};padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${input.ctaLabel}</a>
         </p>`
      : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${input.title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  ${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${input.preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.background};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.silver};">
          <tr>
            <td style="background:${BRAND.navy};padding:28px 32px;text-align:center;">
              <img src="${BRAND_LOGO_URL}" alt="Fuel The Dons" width="180" height="auto" style="display:block;margin:0 auto 12px;max-width:180px;height:auto;" />
              <p style="margin:0;color:${BRAND.silver};font-size:13px;letter-spacing:0.04em;">Madonna Nutrition Management</p>
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
              <p style="margin:0;font-size:12px;color:${BRAND.muted};text-align:center;">
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
