import {
  AGREEMENT_DEMO_STORAGE_KEY,
  AGREEMENT_DEMO_VERSIONS_KEY,
} from "@/config/agreement-defaults"

const LEGACY_DEMO_PREVIEW_KEY = "mnms-demo-preview"
const LEGACY_AUTH_SESSION_KEY = "mnms-demo-session"

/** Clear legacy demo caches and old session keys on logout. */
export function clearLegacySessionCaches(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(LEGACY_DEMO_PREVIEW_KEY)
  sessionStorage.removeItem(LEGACY_AUTH_SESSION_KEY)
  localStorage.removeItem(AGREEMENT_DEMO_STORAGE_KEY)
  localStorage.removeItem(AGREEMENT_DEMO_VERSIONS_KEY)
}

/** @deprecated Use clearLegacySessionCaches */
export const clearAllDemoCaches = clearLegacySessionCaches
