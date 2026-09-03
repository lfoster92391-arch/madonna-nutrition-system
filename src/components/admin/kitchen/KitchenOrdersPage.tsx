"use client"

import Link from "next/link"
import { ClipboardList, Tv } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { useKitchenBoard } from "@/components/admin/kitchen/useKitchenBoard"
import { ADMIN_NAVY } from "@/components/admin/layout/admin-theme"
import { formatCurrency } from "@/lib/utils"
import { STUDENT_LUNCH_PRICE } from "@/config/onboarding-pricing"

export function KitchenOrdersPage() {
  const { data, error, loading } = useKitchenBoard()

  const today = data?.today
  const pizzaLead = data?.pizzaLead

  return (
    <AdminModulePage
      section="Kitchen"
      title="Today’s orders"
      description="See how many people are eating and what to prep before you start cooking."
      icon={ClipboardList}
      headerActions={
        <Link
          href="/admin/kitchen"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#041B52] px-4 text-sm font-semibold text-white"
        >
          <Tv className="h-4 w-4" />
          Open kitchen board
        </Link>
      }
      stats={
        today
          ? [
              { label: "People eating", value: String(today.eatingCount) },
              { label: "Already served", value: String(today.servedCount), variant: "success" },
              {
                label: today.isPizzaDay ? "Pizza slices" : "Waiting",
                value: String(today.isPizzaDay ? today.pizzaSlices : today.waitingCount),
                variant: today.isPizzaDay ? "warning" : "default",
              },
            ]
          : []
      }
    >
      {loading && !data ? <p className="text-[#64748B]">Loading today’s orders…</p> : null}
      {error ? <p className="text-[#D62828]">{error}</p> : null}

      {pizzaLead ? (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
            {pizzaLead.isToday ? "Pizza Day is today" : "Pizza Day this week — place the order"}
          </p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: ADMIN_NAVY }}>
            {pizzaLead.weekdayLabel}: {pizzaLead.totalSlices} slices
          </h2>
          <p className="mt-1 text-[#64748B]">
            {pizzaLead.menuTitle}. {pizzaLead.eatingCount} people eating.
            {pizzaLead.shownFromMonday
              ? " This stays on Monday’s kitchen view until the day ends so you can call in the pizza order."
              : pizzaLead.isToday
                ? " Slice totals stay up until the end of the day."
                : " Totals update as parents and staff order."}
          </p>
        </div>
      ) : null}

      {today ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5">
            <h2 className="text-xl font-bold" style={{ color: ADMIN_NAVY }}>
              What was ordered
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {today.menuTitle
                ? `Published menu: ${today.menuTitle}. Regular lunch is ${formatCurrency(STUDENT_LUNCH_PRICE)}.`
                : "No published lunch menu for today."}
            </p>
            {today.meals.length === 0 ? (
              <p className="mt-4 text-[#64748B]">No lunch orders yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#E8EBF0]">
                {today.meals.map((meal) => (
                  <li key={meal.name} className="flex items-center justify-between py-3">
                    <span className="font-semibold text-[#041B52]">{meal.name}</span>
                    <span className="text-lg font-bold tabular-nums text-[#041B52]">
                      {meal.slices > 0 ? `${meal.slices} slices · ${meal.count} orders` : meal.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5">
            <h2 className="text-xl font-bold" style={{ color: ADMIN_NAVY }}>
              Who is eating
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Lunch number and name. Served means today’s lunch was charged at the kiosk
              (Student Meal) or taken off the account for lunch.
            </p>
            {today.people.length === 0 ? (
              <p className="mt-4 text-[#64748B]">Nobody has ordered yet.</p>
            ) : (
              <ul className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto">
                {today.people.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F8FB] px-3 py-2"
                  >
                    <span>
                      <span className="mr-2 font-bold tabular-nums text-[#64748B]">
                        {person.lunchNumber}
                      </span>
                      <span className="font-semibold text-[#041B52]">{person.name}</span>
                      {person.walkUp ? (
                        <span className="ml-2 text-xs font-semibold uppercase text-[#64748B]">
                          Walk-up
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={
                        person.served ? "text-sm font-bold text-[#00A83E]" : "text-sm font-bold text-amber-600"
                      }
                    >
                      {person.served ? "Served" : "Waiting"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </AdminModulePage>
  )
}
