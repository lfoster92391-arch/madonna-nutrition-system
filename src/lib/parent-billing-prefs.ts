const BILLING_PREFS_KEY = "mnms-parent-billing-prefs"
const SAVED_METHODS_KEY = "mnms-parent-saved-payment-methods"

export type BillingPreferences = {
  emailReceipts: boolean
  monthlyStatements: boolean
  defaultStudentId: string
  fundingReminders: boolean
}

export type SavedPaymentMethod = {
  id: string
  brand: string
  last4: string
  isDefault: boolean
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

export function getSavedPaymentMethods(): SavedPaymentMethod[] {
  return readJson<SavedPaymentMethod[]>(SAVED_METHODS_KEY, [])
}

export function addSavedPaymentMethod(method: Omit<SavedPaymentMethod, "id">) {
  const existing = getSavedPaymentMethods()
  const id = `pm-${Date.now()}`
  const next = existing.map((m) => ({
    ...m,
    isDefault: method.isDefault ? false : m.isDefault,
  }))
  next.push({ ...method, id })
  if (method.isDefault || next.length === 1) {
    next.forEach((m) => {
      m.isDefault = m.id === id
    })
  }
  writeJson(SAVED_METHODS_KEY, next)
}

export function removeSavedPaymentMethod(id: string) {
  const next = getSavedPaymentMethods().filter((m) => m.id !== id)
  if (next.length > 0 && !next.some((m) => m.isDefault)) {
    next[0].isDefault = true
  }
  writeJson(SAVED_METHODS_KEY, next)
}

export function setDefaultPaymentMethod(id: string) {
  const next = getSavedPaymentMethods().map((m) => ({
    ...m,
    isDefault: m.id === id,
  }))
  writeJson(SAVED_METHODS_KEY, next)
}

/** Demo helper — simulates a masked card after opt-in checkout. */
export function simulateSavedMethodFromCheckout() {
  const existing = getSavedPaymentMethods()
  const alreadyHasDemo = existing.some((m) => m.last4 === "4242")
  if (alreadyHasDemo) return
  addSavedPaymentMethod({
    brand: "Visa",
    last4: "4242",
    isDefault: existing.length === 0,
  })
}
