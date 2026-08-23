"use client"

import Link from "next/link"
import { useKitchenBoard } from "@/components/admin/kitchen/useKitchenBoard"
import type { KitchenDaySummary, KitchenLinePerson } from "@/lib/kitchen/board-data"

const AMBER = "#F59E0B"
const GREEN = "#00A83E"
const WHITE = "#FFFFFF"

export function KitchenBoard() {
  const { data, error, loading } = useKitchenBoard()

  if (loading && !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#041B52] text-white">
        <p className="text-3xl font-semibold">Loading today’s lunch line…</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#041B52] p-8 text-white">
        <p className="text-2xl">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { today, pizzaLead, weekAhead, weekAheadLabel } = data
  const waiting = today.people.filter((p) => !p.served)
  const served = today.people.filter((p) => p.served)
  const weekOrderedTotal = weekAhead.reduce((sum, day) => sum + day.orderedCount, 0)

  return (
    <div className="min-h-[calc(100dvh-8rem)] bg-[#041B52] px-4 py-5 text-white sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">Fuel The Dons</p>
          <h1 className="mt-1 text-4xl font-bold sm:text-5xl lg:text-6xl">Kitchen board</h1>
          <p className="mt-2 text-xl text-white/80 sm:text-2xl">
            {today.weekdayLabel}
            {today.menuTitle ? ` · ${today.menuTitle}` : " · No menu published"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="text-lg text-white/60">Updates every 20 seconds</p>
          <Link
            href="/admin/kitchen/sunday-head-count"
            className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            Sunday head count
          </Link>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eating today" value={today.eatingCount} />
        <StatCard label="Still waiting" value={today.waitingCount} accent={AMBER} />
        <StatCard label="Already served" value={today.servedCount} accent={GREEN} />
        <StatCard
          label={today.isPizzaDay ? "Pizza slices" : "Walk-ups"}
          value={today.isPizzaDay ? today.pizzaSlices : today.walkUpCount}
        />
      </section>

      {today.meals.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6">
          <h2 className="text-2xl font-bold">Quantities from orders</h2>
          <p className="mt-1 text-white/70">Parent and staff meal selections for today</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {today.meals.map((meal) => (
              <li
                key={meal.name}
                className="flex items-baseline justify-between gap-3 rounded-xl bg-black/20 px-4 py-3"
              >
                <span className="text-lg font-semibold">{meal.name}</span>
                <span className="text-3xl font-bold tabular-nums">
                  {meal.count}
                  {meal.slices > 0 ? (
                    <span className="ml-2 text-base font-medium text-white/70">
                      ({meal.slices} slices)
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pizzaLead ? (
        <section className="mt-6 rounded-2xl border-2 border-white/20 bg-white/10 p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
            {pizzaLead.isToday ? "Pizza Day — order these slices today" : "Pizza Day this week — order before the day ends"}
          </p>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">
            {pizzaLead.weekdayLabel}: {pizzaLead.totalSlices} slices
          </p>
          <p className="mt-1 text-lg text-white/80">
            {pizzaLead.menuTitle} · {pizzaLead.eatingCount} people eating
            {pizzaLead.shownFromMonday ? " · Shown Monday so you can place the pizza order" : ""}
          </p>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Week-ahead head counts</h2>
            <p className="mt-1 text-white/70">{weekAheadLabel}</p>
          </div>
          <p className="text-3xl font-bold tabular-nums">{weekOrderedTotal} reserved</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {weekAhead.map((day) => (
            <WeekDayCard key={day.date} day={day} isToday={day.date === today.date} />
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <NameColumn
          title="Waiting to be served"
          empty="Everyone who ordered has been served."
          people={waiting}
          accent={AMBER}
        />
        <NameColumn
          title="Served"
          empty="No lunch scans yet."
          people={served}
          accent={GREEN}
        />
      </section>
    </div>
  )
}

function WeekDayCard({ day, isToday }: { day: KitchenDaySummary; isToday: boolean }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        isToday ? "border-amber-300/60 bg-amber-300/10" : "border-white/15 bg-black/20"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {day.weekdayLabel.split(",")[0]}
      </p>
      <p className="mt-1 truncate text-sm text-white/80">{day.menuTitle ?? "No menu"}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{day.orderedCount}</p>
      <p className="text-xs text-white/60">
        reserved
        {day.pizzaSlices > 0 ? ` · ${day.pizzaSlices} slices` : ""}
      </p>
      {day.meals.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-white/70">
          {day.meals.slice(0, 3).map((m) => (
            <li key={m.name} className="truncate">
              {m.count}× {m.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = WHITE,
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4">
      <p className="text-sm font-semibold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-1 text-5xl font-bold tabular-nums sm:text-6xl" style={{ color: accent }}>
        {value}
      </p>
    </div>
  )
}

function NameColumn({
  title,
  empty,
  people,
  accent,
}: {
  title: string
  empty: string
  people: KitchenLinePerson[]
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black/20 p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <p className="text-3xl font-bold tabular-nums" style={{ color: accent }}>
          {people.length}
        </p>
      </div>
      {people.length === 0 ? (
        <p className="text-xl text-white/60">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-baseline justify-between gap-3 rounded-xl bg-white/5 px-3 py-2"
            >
              <span className="text-2xl font-semibold leading-tight sm:text-3xl">
                <span className="mr-3 font-bold tabular-nums text-white/70">{person.lunchNumber}</span>
                {person.name}
              </span>
              <span className="shrink-0 text-lg text-white/70">
                {person.sliceCount ? `${person.sliceCount} slices` : person.mealName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
