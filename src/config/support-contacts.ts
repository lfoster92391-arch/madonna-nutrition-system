/** Canonical Fuel The Dons support contacts — Mrs. Morris and Mrs. Dalfol only. */
export type SupportContact = {
  name: string
  email: string
}

export const SUPPORT_CONTACTS: readonly SupportContact[] = [
  { name: "Mrs. Morris", email: "lisamorris@weirtonmadonna.org" },
  { name: "Mrs. Dalfol", email: "jdalfol@weirtonmadonna.org" },
] as const

/** Mrs. Morris mailbox — used for security/ops alerts, not a public “IT Help Desk” label. */
export const PRIMARY_SUPPORT_EMAIL = SUPPORT_CONTACTS[0].email

export function getSupportMailto(email: string): string {
  return `mailto:${email}`
}

/** Compose to both support contacts (Need help / forgot password). */
export function getSupportMailtoAll(): string {
  return `mailto:${SUPPORT_CONTACTS.map((c) => c.email).join(",")}`
}

export function formatSupportNames(conjunction = "or"): string {
  const names = SUPPORT_CONTACTS.map((c) => c.name)
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} ${conjunction} ${names[names.length - 1]}`
}

export function formatSupportDirectory(): string {
  return SUPPORT_CONTACTS.map((c) => `${c.name} (${c.email})`).join(" or ")
}
