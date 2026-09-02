/** Server-side kiosk station PIN — never expose in client bundles. */

const DEFAULT_KIOSK_CASHIER_PIN = "0901"

export function getKioskCashierPin(): string {
  return process.env.KIOSK_CASHIER_PIN?.trim() || DEFAULT_KIOSK_CASHIER_PIN
}

export function verifyKioskCashierPin(pin: string): boolean {
  const expected = getKioskCashierPin()
  if (!/^\d{4}$/.test(pin)) return false
  return pin === expected
}
