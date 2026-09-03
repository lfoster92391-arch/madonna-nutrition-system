/**
 * Shared discovery map shape for portal option buttons.
 * Top-level categories → destinations (href or onClick). Preserve features; only regroup UX.
 */

export type PortalNavItem = {
  label: string
  href?: string
  /** Optional action when the destination is a drawer / in-page scroll, not a route. */
  action?: string
  external?: boolean
}

export type PortalNavCategory = {
  id: string
  label: string
  /** Short label for cramped top bars; falls back to label. */
  shortLabel?: string
  items: PortalNavItem[]
}
