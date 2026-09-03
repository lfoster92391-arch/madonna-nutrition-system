"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, ClipboardList, Clock, UserRound, UtensilsCrossed } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"
import { getSessionHeaders } from "@/lib/api/client"
import type { LunchSignupRosterPayload, LunchSignupRosterRow } from "@/lib/workplace/lunch-signup-roster"
import { cn } from "@/lib/utils"

export const TEACHER_TODAY_SIGNUP_ROSTER_QUERY_KEY = ["teacher-today-lunch-signup-roster"] as const

function formatSignedUpWhen(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  })
}

async function fetchTodayRoster(): Promise<LunchSignupRosterPayload> {
  const res = await fetch("/api/workplace/lunch-signups", {
    headers: getSessionHeaders(),
    cache: "no-store",
  })
  const body = (await res.json().catch(() => ({}))) as LunchSignupRosterPayload & {
    error?: string
  }
  if (!res.ok) {
    throw new Error(body.error ?? "Unable to load today’s lunch signups")
  }
  return body
}

function statusBadgeClass(status: string) {
  if (status === "SERVED") return "bg-[#00A83E]/15 text-[#00A83E]"
  if (status === "RESERVED") return "bg-[#0A1E3F]/10 text-[#0A1E3F]"
  return ""
}

function RosterRow({ row }: { row: LunchSignupRosterRow }) {
  return (
    <li
      className="rounded-2xl border bg-white px-3 py-3"
      style={{ borderColor: TEACHER_SILVER }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" style={{ color: TEACHER_NAVY }}>
            {row.studentName}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: TEACHER_SILVER }}>
            {row.mealLabel}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[10px]", statusBadgeClass(row.status))}
        >
          {row.statusLabel}
        </Badge>
      </div>
      <dl className="mt-2 space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: TEACHER_SILVER }} />
          <div>
            <dt className="sr-only">Signed up by</dt>
            <dd style={{ color: TEACHER_NAVY }}>
              {row.signedUpBy ? (
                <>
                  {row.signedUpBy.name}
                  <span style={{ color: TEACHER_SILVER }}> ({row.signedUpBy.role})</span>
                </>
              ) : (
                <span style={{ color: TEACHER_SILVER }}>Online order (signer not recorded)</span>
              )}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: TEACHER_SILVER }} />
          <div>
            <dt className="sr-only">Signed up at</dt>
            <dd style={{ color: TEACHER_NAVY }}>
              {row.signedUpAt ? formatSignedUpWhen(row.signedUpAt) : "Time not available"}
            </dd>
          </div>
        </div>
      </dl>
    </li>
  )
}

/** Live “who’s signed up today” roster for Teacher Find Student (before a student is selected). */
export function TeacherTodaySignupRosterPanel() {
  const { databaseEnabled } = useDemo()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: TEACHER_TODAY_SIGNUP_ROSTER_QUERY_KEY,
    enabled: databaseEnabled,
    queryFn: fetchTodayRoster,
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
  })

  const today = data?.today
  const signups = today?.signups ?? []

  return (
    <Card
      className="rounded-[20px] border p-4 shadow-sm sm:p-6"
      style={{ borderColor: TEACHER_SILVER }}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 shrink-0" style={{ color: TEACHER_NAVY }} />
          <div>
            <h3 className="text-sm font-bold" style={{ color: TEACHER_NAVY }}>
              Who&apos;s signed up today
            </h3>
            <p className="text-xs" style={{ color: TEACHER_SILVER }}>
              Live lunch roster
              {isFetching && !isLoading ? " · updating…" : null}
            </p>
          </div>
        </div>
        {today ? (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {today.count} signed up
          </Badge>
        ) : null}
      </div>

      <p className="mt-3 text-sm" style={{ color: TEACHER_SILVER }}>
        Search or select a student to assist with lunch signup. The roster below updates as
        signups come in.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm" style={{ color: TEACHER_SILVER }}>
          Loading today&apos;s lunch signups…
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-[#D62828]">
          {error instanceof Error ? error.message : "Unable to load today’s lunch signups"}
        </p>
      ) : null}

      {!isLoading && !error && signups.length === 0 ? (
        <div
          className="mt-4 rounded-xl border border-dashed bg-[#F7F8FA] px-3 py-8 text-center"
          style={{ borderColor: TEACHER_SILVER }}
        >
          <UtensilsCrossed className="mx-auto h-5 w-5" style={{ color: TEACHER_SILVER }} />
          <p className="mt-2 text-sm font-medium" style={{ color: TEACHER_NAVY }}>
            Nobody signed up yet today
          </p>
          <p className="mt-1 text-xs" style={{ color: TEACHER_SILVER }}>
            When teachers, staff, or parents reserve lunch, students appear here live.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && signups.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: TEACHER_SILVER }}>
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
            <span>
              {today?.menuTitle ? `Menu: ${today.menuTitle}` : "Today’s lunch"}
              {" · "}
              {today?.weekdayLabel}
            </span>
          </div>
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {signups.map((row) => (
              <RosterRow key={row.id} row={row} />
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}
