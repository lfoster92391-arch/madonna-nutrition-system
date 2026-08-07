"use client"

import { UtensilsCrossed } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { OrderLunchAction } from "@/components/parent/OrderLunchAction"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { getMealCoverPhoto } from "@/lib/meal-templates"
import { isPublicCalendarEvent, todayDateKey } from "@/lib/calendar-publish"

export function TodaysMenuSection() {
  const { calendarEvents, mealTemplates } = useDemo()
  const today = todayDateKey()
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const todaysMenuEvents = calendarEvents.filter(
    (e) => e.date === today && e.category === "menu_day" && isPublicCalendarEvent(e)
  )

  const mealTemplatesById = new Map(mealTemplates.map((t) => [t.id, t]))
  const primaryEvent = todaysMenuEvents[0]
  const linkedTemplate = primaryEvent?.mealTemplateId
    ? mealTemplatesById.get(primaryEvent.mealTemplateId)
    : undefined
  const cover = linkedTemplate ? getMealCoverPhoto(linkedTemplate.photos) : undefined

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
        Today&apos;s Lunch Menu
      </h2>
      <div className={`${PARENT_CARD} p-5 md:p-6`}>
        {!primaryEvent ? (
          <div className="flex items-start gap-3">
            <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#64748B]">{todayLabel}</p>
              <p className="mt-2 text-base font-semibold" style={{ color: PARENT_NAVY }}>
                Menu not published yet
              </p>
              <p className="mt-4 text-sm text-[#64748B]">
                Today&apos;s lunch menu will appear here once published from Admin Calendar. You can
                still order for another school day from the calendar.
              </p>
              <p className="mt-3 text-sm">
                <a
                  href="/parent/calendar"
                  className="font-semibold underline-offset-2 hover:underline"
                  style={{ color: PARENT_NAVY }}
                >
                  View lunch calendar
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#64748B]">{todayLabel}</p>
              <p className="mt-1 text-lg font-bold" style={{ color: PARENT_NAVY }}>
                {primaryEvent.title}
              </p>
              {primaryEvent.description && (
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                  {primaryEvent.description}
                </p>
              )}
              {linkedTemplate && linkedTemplate.items.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-[#64748B]">
                  {linkedTemplate.items.map((item) => (
                    <li key={item.id}>• {item.name}</li>
                  ))}
                </ul>
              )}
              {linkedTemplate?.allergens && linkedTemplate.allergens.length > 0 && (
                <p className="mt-3 text-xs font-medium text-[#64748B]">
                  Allergens: {linkedTemplate.allergens.join(", ")}
                </p>
              )}
              <OrderLunchAction date={today} menuTitle={primaryEvent.title} enabled />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
