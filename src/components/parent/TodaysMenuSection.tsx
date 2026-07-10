"use client"

import { useMemo } from "react"
import { UtensilsCrossed } from "lucide-react"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { useDemo } from "@/components/providers/DemoProvider"
import { formatDateKey } from "@/lib/calendar"
import { formatCurrency } from "@/lib/utils"

export function TodaysMenuSection() {
  const { calendarEvents, mealTemplates } = useDemo()

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const todaysMenu = useMemo(() => {
    const todayKey = formatDateKey(new Date())
    return calendarEvents.find(
      (e) =>
        e.category === "menu_day" &&
        e.publishStatus === "published" &&
        e.date === todayKey
    )
  }, [calendarEvents])

  const template = useMemo(
    () =>
      todaysMenu?.mealTemplateId
        ? mealTemplates.find((t) => t.id === todaysMenu.mealTemplateId)
        : undefined,
    [todaysMenu, mealTemplates]
  )

  const menuDescription = todaysMenu?.description ?? template?.description
  const price = template?.studentMealPrice

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
        Today&apos;s Menu
      </h2>
      <div className={`${PARENT_CARD} p-5 md:p-6`}>
        <div className="flex items-start gap-3">
          <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#64748B]">{todayLabel}</p>
            {todaysMenu ? (
              <>
                <p className="mt-2 text-base font-semibold" style={{ color: PARENT_NAVY }}>
                  {todaysMenu.title}
                </p>
                {menuDescription && (
                  <p className="mt-2 text-sm text-[#64748B]">{menuDescription}</p>
                )}
                {typeof price === "number" && (
                  <p className="mt-3 text-sm font-semibold" style={{ color: PARENT_NAVY }}>
                    {formatCurrency(price)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-base font-semibold" style={{ color: PARENT_NAVY }}>
                  Menu not published yet
                </p>
                <p className="mt-4 text-sm text-[#64748B]">
                  Today&apos;s lunch menu will appear here once published from Admin Calendar.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
