"use client"

import { UtensilsCrossed } from "lucide-react"
import { todaysMenuItems } from "@/data/demo"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"

export function TodaysMenuSection() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const main = todaysMenuItems[0] ?? "Today's entrée"
  const sides = todaysMenuItems.slice(1)

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
        Today&apos;s Menu
      </h2>
      <div className={`${PARENT_CARD} p-5 md:p-6`}>
        <div className="flex items-start gap-3">
          <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#64748B]">{today}</p>
            <p className="mt-2 text-base font-semibold" style={{ color: PARENT_NAVY }}>
              {main}
            </p>
            {sides.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-[#64748B]">
                {sides.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-[#64748B]">
              Balanced meal includes protein, grains, vegetables, fruit, and milk.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
