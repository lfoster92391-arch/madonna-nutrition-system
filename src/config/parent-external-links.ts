/** External family login resources shown on the parent Quick Actions strip. */

const DEFAULT_FACTS_URL = "https://www.factsmgt.com/"
const DEFAULT_ASSETPILOT_URL = "https://assetpilotedu.com"
const DEFAULT_NUTRITION_EMAIL = "nutrition@madonnahs.org"

export function getFactsFamilyLoginUrl(): string {
  return process.env.NEXT_PUBLIC_FACTS_FAMILY_PORTAL_URL?.trim() || DEFAULT_FACTS_URL
}

export function getAssetPilotEduUrl(): string {
  return process.env.NEXT_PUBLIC_ASSETPILOT_EDU_URL?.trim() || DEFAULT_ASSETPILOT_URL
}

/** Opens Gmail compose when available; falls back to mailto. */
export function getParentGmailUrl(): string {
  const email =
    process.env.NEXT_PUBLIC_SCHOOL_NUTRITION_EMAIL?.trim() || DEFAULT_NUTRITION_EMAIL
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
}

export function getParentNutritionEmail(): string {
  return process.env.NEXT_PUBLIC_SCHOOL_NUTRITION_EMAIL?.trim() || DEFAULT_NUTRITION_EMAIL
}
