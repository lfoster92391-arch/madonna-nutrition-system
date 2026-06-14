/** Domains allowed to sign in to the Teacher Portal. */
export const allowedTeacherDomains = ["weirtonmadonna.org"] as const

export function isAllowedTeacherEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  const at = normalized.lastIndexOf("@")
  if (at < 0) return false
  const domain = normalized.slice(at + 1)
  return (allowedTeacherDomains as readonly string[]).includes(domain)
}

export const TEACHER_ACCESS_DENIED_MESSAGE =
  "Access denied. Teacher accounts must use an approved school email domain."
