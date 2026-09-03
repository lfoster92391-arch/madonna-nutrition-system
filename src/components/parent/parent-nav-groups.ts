import type { PortalNavCategory } from "@/components/nav/nav-types"
import {
  getAssetPilotEduUrl,
  getFactsFamilyLoginUrl,
} from "@/config/parent-external-links"
import { SUPPORT_CONTACTS, getSupportMailto } from "@/config/support-contacts"

/**
 * Parent portal discovery groups — aligned with Lisa's category map.
 * Drawer actions use `action` keys resolved by QuickActionsStrip / ParentCommandCenter.
 */
export const PARENT_NAV_CATEGORIES: PortalNavCategory[] = [
  {
    id: "order-menu",
    label: "Order lunch / Menu",
    shortLabel: "Order lunch",
    items: [
      { label: "Order Lunch", href: "/parent/reserve-lunch" },
      { label: "My Selections", href: "/parent/orders" },
      { label: "Meal Activity", action: "meal-activity" },
    ],
  },
  {
    id: "account",
    label: "Account & balances",
    shortLabel: "Account",
    items: [
      { label: "Payments", href: "/parent/payments" },
      { label: "Add Funds", action: "add-funds" },
      { label: "History", action: "history" },
    ],
  },
  {
    id: "children",
    label: "Children / profile",
    shortLabel: "Children",
    items: [{ label: "Students", action: "students" }],
  },
  {
    id: "alerts",
    label: "Alerts & messages",
    shortLabel: "Alerts",
    items: [{ label: "Alerts", action: "alerts" }],
  },
  {
    id: "guide",
    label: "Guide",
    items: [
      { label: "How-to Guide", href: "/parent/guide" },
      { label: "Support", href: "/parent/help" },
      {
        label: "FACTS Family Login",
        href: getFactsFamilyLoginUrl(),
        external: true,
      },
      {
        label: "AssetPilot Edu",
        href: getAssetPilotEduUrl(),
        external: true,
      },
      ...SUPPORT_CONTACTS.map((contact) => ({
        label: contact.name,
        href: getSupportMailto(contact.email),
        external: true,
      })),
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [{ label: "Settings", action: "settings" }],
  },
]
