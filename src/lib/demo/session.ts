import type { UserRole } from "@/lib/types"
import {
  AGREEMENT_DEMO_STORAGE_KEY,
  AGREEMENT_DEMO_VERSIONS_KEY,
} from "@/config/agreement-defaults"

export const DEMO_PREVIEW_STORAGE_KEY = "mnms-demo-preview"
export const DEMO_PASSWORD = "FuelTheDons2026!"

export type DemoPortal = "parent" | "admin" | "teacher"

export interface DemoAccount {
  portal: DemoPortal
  username: string
  role: UserRole
  path: string
  label: string
  subtitle: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    portal: "parent",
    username: "sarah.anderson",
    role: "parent",
    path: "/parent",
    label: "Parent Demo",
    subtitle: "Sarah Anderson",
  },
  {
    portal: "admin",
    username: "d.garcia",
    role: "admin",
    path: "/admin",
    label: "Admin Demo",
    subtitle: "Diana Garcia",
  },
  {
    portal: "teacher",
    username: "m.anderson",
    role: "teacher",
    path: "/teacher",
    label: "Teacher Demo",
    subtitle: "Michelle Anderson",
  },
]

const DEMO_PREVIEW_EVENT = "mnms-demo-preview-change"

export function readDemoPreview(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(DEMO_PREVIEW_STORAGE_KEY) === "1"
}

export function writeDemoPreview(active: boolean) {
  if (typeof window === "undefined") return
  if (active) {
    sessionStorage.setItem(DEMO_PREVIEW_STORAGE_KEY, "1")
  } else {
    sessionStorage.removeItem(DEMO_PREVIEW_STORAGE_KEY)
  }
  window.dispatchEvent(new CustomEvent(DEMO_PREVIEW_EVENT, { detail: active }))
}

export function isDemoPreviewActive(): boolean {
  return readDemoPreview()
}

export function subscribeDemoPreview(onChange: (active: boolean) => void) {
  if (typeof window === "undefined") return () => undefined
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<boolean>).detail
    onChange(typeof detail === "boolean" ? detail : readDemoPreview())
  }
  window.addEventListener(DEMO_PREVIEW_EVENT, handler)
  return () => window.removeEventListener(DEMO_PREVIEW_EVENT, handler)
}

export function getDemoAccount(portal: DemoPortal): DemoAccount {
  const account = DEMO_ACCOUNTS.find((item) => item.portal === portal)
  if (!account) {
    throw new Error(`Unknown demo portal: ${portal}`)
  }
  return account
}

const DEMO_CACHE_KEYS = [AGREEMENT_DEMO_STORAGE_KEY, AGREEMENT_DEMO_VERSIONS_KEY] as const

/** Clear demo preview flag and localStorage demo caches (agreements, etc.). */
export function clearAllDemoCaches(): void {
  if (typeof window === "undefined") return
  writeDemoPreview(false)
  for (const key of DEMO_CACHE_KEYS) {
    localStorage.removeItem(key)
  }
}

/** Open parent portal Sarah Anderson walkthrough in a new tab (admin sidebar). */
export function openParentDemoWalkthrough(): void {
  if (typeof window === "undefined") return
  writeDemoPreview(true)
  window.open("/parent?demo=sarah", "_blank", "noopener,noreferrer")
}
