const BILLING_PREFS_KEY = "mnms-parent-billing-prefs"

export type BillingPreferences = {
  emailReceipts: boolean
  monthlyStatements: boolean
  defaultStudentId: string
  fundingReminders: boolean
}

const DEFAULT_BILLING_PREFS: BillingPreferences = {
  emailReceipts: true,
  monthlyStatements: false,
  defaultStudentId: "",
  fundingReminders: true,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

export function getBillingPreferences(): BillingPreferences {
  return readJson(BILLING_PREFS_KEY, DEFAULT_BILLING_PREFS)
}

export function setBillingPreferences(prefs: Partial<BillingPreferences>) {
  writeJson(BILLING_PREFS_KEY, { ...getBillingPreferences(), ...prefs })
}

/** Clear any legacy localStorage keys that previously pretended to store cards. */
export function clearLegacySavedCardStorage(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem("mnms-parent-saved-payment-methods")
  } catch {
    // ignore
  }
}
