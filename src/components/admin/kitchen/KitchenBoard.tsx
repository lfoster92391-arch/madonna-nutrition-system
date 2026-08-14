"use client"

import { useKitchenBoard } from "@/components/admin/kitchen/useKitchenBoard"
import type { KitchenLinePerson } from "@/lib/kitchen/board-data"

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

  const { today, pizzaLead } = data
  const waiting = today.people.filter((p) => !p.served)
  const served = today.people.filter((p) => p.served)

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
        <p className="text-lg text-white/60">Updates every 20 seconds</p>
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
