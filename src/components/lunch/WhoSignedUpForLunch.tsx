"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList, RefreshCw, UserPlus } from "lucide-react"
import { getSessionHeaders } from "@/lib/api/client"
import type { LunchSignupRosterPayload } from "@/lib/workplace/lunch-signup-roster"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type WhoSignedUpForLunchProps = {
  portalLabel: string
  accentColor?: string
  backgroundColor?: string
  signUpHref: string
}

export function WhoSignedUpForLunch({
  portalLabel,
  accentColor = "#041B52",
  backgroundColor = "#F7F8FB",
  signUpHref,
}: WhoSignedUpForLunchProps) {
  const [data, setData] = useState<LunchSignupRosterPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/workplace/lunch-signups", {
        headers: getSessionHeaders(),
        cache: "no-store",
      })
      const body = (await res.json().catch(() => ({}))) as LunchSignupRosterPayload & {
        error?: string
      }
      if (!res.ok) {
        throw new Error(body.error ?? "Unable to load who signed up for lunch")
      }
      setData(body)
      setSelectedDate((prev) => prev ?? body.today.date)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load who signed up for lunch")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const activeDate = selectedDate ?? data?.today.date ?? null
  const activeDay =
    data?.week.find((day) => day.date === activeDate) ??
    (data?.today.date === activeDate ? data.today : null) ??
    data?.today ??
    null

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6" style={{ backgroundColor }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>
            {portalLabel}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl" style={{ color: accentColor }}>
            <ClipboardList className="h-7 w-7 shrink-0" aria-hidden />
            Who signed up for lunch
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#64748B]">
            Students with a reserved lunch for today and the upcoming school week — name, MD ID,
            meal, and date. Same signup list the kitchen uses for prep counts (no account balances).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Link
            href={signUpHref}
            className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Sign up a student
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </Card>
      ) : null}

      {loading && !data ? (
        <p className="text-sm text-[#64748B]">Loading lunch signups…</p>
      ) : null}

      {data ? (
        <>
          <div className="flex flex-wrap gap-2">
            {!data.week.some((day) => day.date === data.today.date) ? (
              <button
                type="button"
                onClick={() => setSelectedDate(data.today.date)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition",
                  activeDay?.date === data.today.date
                    ? "text-white shadow-sm"
                    : "bg-white hover:bg-[#0A1E3F]/5"
                )}
                style={
                  activeDay?.date === data.today.date
                    ? { backgroundColor: accentColor, borderColor: accentColor }
                    : { borderColor: "#AEB6C2", color: accentColor }
                }
              >
                <span className="block font-semibold">Today</span>
                <span
                  className={cn(
                    "block text-xs",
                    activeDay?.date === data.today.date ? "text-white/80" : "text-[#64748B]"
                  )}
                >
                  {data.today.count} signed up
                </span>
              </button>
            ) : null}
            {data.week.map((day) => {
              const isActive = day.date === activeDay?.date
              const isToday = day.date === data.today.date
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm transition",
                    isActive ? "text-white shadow-sm" : "bg-white hover:bg-[#0A1E3F]/5"
                  )}
                  style={
                    isActive
                      ? { backgroundColor: accentColor, borderColor: accentColor }
                      : { borderColor: "#AEB6C2", color: accentColor }
                  }
                >
                  <span className="block font-semibold">
                    {isToday ? "Today" : day.weekdayLabel.split(",")[0]}
                  </span>
                  <span className={cn("block text-xs", isActive ? "text-white/80" : "text-[#64748B]")}>
                    {day.count} signed up
                  </span>
                </button>
              )
            })}
          </div>

          {activeDay ? (
            <Card className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderColor: "#AEB6C2" }}>
              <div className="border-b px-4 py-4 sm:px-6" style={{ borderColor: "#AEB6C2" }}>
                <h2 className="text-lg font-bold" style={{ color: accentColor }}>
                  {activeDay.date === data.today.date ? "Today · " : ""}
                  {activeDay.weekdayLabel}
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  {activeDay.menuTitle
                    ? `Menu: ${activeDay.menuTitle}`
                    : "No published menu for this day"}
                  {" · "}
                  {activeDay.count} student{activeDay.count === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">{data.weekLabel}</p>
              </div>

              {activeDay.signups.length === 0 ? (
                <div className="px-4 py-10 text-center sm:px-6">
                  <p className="text-sm text-[#64748B]">No students have signed up for this day yet.</p>
                  <Link
                    href={signUpHref}
                    className="mt-4 inline-flex text-sm font-semibold underline"
                    style={{ color: accentColor }}
                  >
                    Sign up a student
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr
                        className="border-b text-xs uppercase tracking-wide"
                        style={{ borderColor: "#AEB6C2", color: "#AEB6C2" }}
                      >
                        <th className="px-4 pb-3 pt-4 font-semibold sm:px-6">Student</th>
                        <th className="pb-3 pr-4 pt-4 font-semibold">MD ID</th>
                        <th className="pb-3 pr-4 pt-4 font-semibold">Meal / items</th>
                        <th className="pb-3 pr-6 pt-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDay.signups.map((row) => (
                        <tr key={row.id} className="border-b last:border-0" style={{ borderColor: "#E8EBF0" }}>
                          <td className="px-4 py-3 font-medium sm:px-6" style={{ color: accentColor }}>
                            {row.studentName}
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-[#64748B]">{row.mdId}</td>
                          <td className="py-3 pr-4" style={{ color: accentColor }}>
                            {row.mealLabel}
                          </td>
                          <td className="py-3 pr-6 text-[#64748B]">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
