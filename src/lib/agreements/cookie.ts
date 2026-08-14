/** HttpOnly cookie set after a successful cafeteria agreement sign. */
export const AGREEMENT_ACCEPTED_COOKIE = "mnms-cafeteria-agreed"

export const AGREEMENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400

export function parseAgreementAcceptedCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(";")
  for (const part of parts) {
    const [rawName, ...rest] = part.trim().split("=")
    if (rawName === AGREEMENT_ACCEPTED_COOKIE) {
      const value = rest.join("=").trim()
      return value || null
    }
  }
  return null
}
