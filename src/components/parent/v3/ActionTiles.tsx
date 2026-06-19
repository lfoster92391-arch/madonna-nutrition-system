"use client"

import { Bell, Settings, UtensilsCrossed, Wallet } from "lucide-react"
import { V3_CARD, V3_CARD_BORDER, V3_NAVY } from "@/components/parent/v3/parent-v3-theme"
import type { ParentDrawerId } from "@/components/parent/v3/parent-v3-theme"

const TILES: {
  id: Exclude<ParentDrawerId, null>
  label: string
  description: string
  icon: typeof Wallet
}[] = [
  {
    id: "add-funds",
    label: "Add Funds",
    description: "Deposit to a student account",
    icon: Wallet,
  },
  {
    id: "meal-activity",
    label: "Meal Activity",
    description: "Recent purchases for your family",
    icon: UtensilsCrossed,
  },
  {
    id: "alerts",
    label: "Alerts",
    description: "Balances and reviews needing attention",
    icon: Bell,
  },
  {
    id: "settings",
    label: "Family Settings",
    description: "Notifications and preferences",
    icon: Settings,
  },
]

type ActionTilesProps = {
  onOpenDrawer: (drawer: Exclude<ParentDrawerId, null>) => void
}

export function ActionTiles({ onOpenDrawer }: ActionTilesProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: V3_NAVY }}>
        What would you like to do?
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpenDrawer(id)}
            className={`${V3_CARD} ${V3_CARD_BORDER} flex min-h-[120px] flex-col items-start gap-3 p-5 text-left transition hover:border-[#041B52]/30 hover:bg-[#041B52]/[0.02]`}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#041B52]/5"
              aria-hidden
            >
              <Icon className="h-5 w-5" style={{ color: V3_NAVY }} />
            </span>
            <span>
              <span className="block text-sm font-bold" style={{ color: V3_NAVY }}>
                {label}
              </span>
              <span className="mt-1 block text-xs text-[#64748B]">{description}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
