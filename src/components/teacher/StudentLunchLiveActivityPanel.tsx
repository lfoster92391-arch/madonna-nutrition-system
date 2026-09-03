"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, Clock, UserRound, UtensilsCrossed } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"
import type { StudentLunchLiveActivity } from "@/lib/teacher/types"
import { formatCurrency } from "@/lib/utils"

const PAYMENT_LABELS: Record<string, string> = {
  account: "Account funds",
  prepay_online: "Prepaid online",
  pay_at_kiosk: "Pay at kiosk",
}

function formatSignedUpWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatUpcomingDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

async function fetchLunchActivity(
  studentId: string,
  teacherId: string
): Promise<StudentLunchLiveActivity> {
  const res = await fetch(
    `/api/teacher/students/${encodeURIComponent(studentId)}/lunch-activity?teacherId=${encodeURIComponent(teacherId)}`
  )
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? "Unable to load lunch activity")
  }
  return res.json()
}

type StudentLunchLiveActivityPanelProps = {
  studentId: string
  studentFirstName: string
  /** Bump after a local signup so the panel refreshes immediately. */
  refreshToken?: number
}

export function StudentLunchLiveActivityPanel({
  studentId,
  studentFirstName,
  refreshToken = 0,
}: StudentLunchLiveActivityPanelProps) {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["teacher-student-lunch-activity", studentId, user?.id, refreshToken],
    enabled: Boolean(databaseEnabled && user?.id && studentId),
    queryFn: () => fetchLunchActivity(studentId, user!.id),
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
  })

  return (
    <div
      className="mt-5 rounded-2xl border p-4"
      style={{ borderColor: TEACHER_SILVER, backgroundColor: "#F7F8FA" }}
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 shrink-0" style={{ color: TEACHER_NAVY }} />
          <div>
            <h3 className="text-sm font-bold" style={{ color: TEACHER_NAVY }}>
              Live activity
            </h3>
            <p className="text-xs" style={{ color: TEACHER_SILVER }}>
              Today&apos;s lunch signup status
              {isFetching && !isLoading ? " · updating…" : null}
            </p>
          </div>
        </div>
        {data?.signedUp ? (
          <Badge className="bg-[#00A83E]/15 text-[#00A83E]">Signed up</Badge>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm" style={{ color: TEACHER_SILVER }}>
          Checking lunch signup…
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-[#D62828]">
          {error instanceof Error ? error.message : "Unable to load lunch activity"}
        </p>
      ) : null}

      {!isLoading && !error && data && !data.signedUp ? (
        <div
          className="mt-3 rounded-xl border border-dashed bg-white px-3 py-4 text-center"
          style={{ borderColor: TEACHER_SILVER }}
        >
          <UtensilsCrossed className="mx-auto h-5 w-5" style={{ color: TEACHER_SILVER }} />
          <p className="mt-2 text-sm font-medium" style={{ color: TEACHER_NAVY }}>
            Not signed up for lunch today
          </p>
          <p className="mt-1 text-xs" style={{ color: TEACHER_SILVER }}>
            {studentFirstName} has no lunch reservation for today yet.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && data?.signedUp && data.activity ? (
        <div className="mt-3 space-y-3">
          <div
            className="rounded-xl border bg-white px-3 py-3"
            style={{ borderColor: TEACHER_SILVER }}
          >
            <p className="text-sm font-semibold" style={{ color: TEACHER_NAVY }}>
              {data.activity.mealName ||
                data.activity.items.map((i) => i.mealTypeLabel).join(" · ") ||
                "Lunch reserved"}
            </p>
            <p className="mt-1 text-xs" style={{ color: TEACHER_SILVER }}>
              {data.activity.statusLabel}
              {data.activity.paymentMethod
                ? ` · ${PAYMENT_LABELS[data.activity.paymentMethod] ?? data.activity.paymentMethod}`
                : null}
            </p>

            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEACHER_SILVER }} />
                <div>
                  <dt
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: TEACHER_SILVER }}
                  >
                    Signed up by
                  </dt>
                  <dd style={{ color: TEACHER_NAVY }}>
                    {data.activity.signedUpBy ? (
                      <>
                        {data.activity.signedUpBy.name}
                        <span className="text-silver-foreground">
                          {" "}
                          ({data.activity.signedUpBy.role})
                        </span>
                      </>
                    ) : (
                      <span className="text-silver-foreground">
                        Online order (signer not recorded)
                      </span>
                    )}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEACHER_SILVER }} />
                <div>
                  <dt
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: TEACHER_SILVER }}
                  >
                    Signed up at
                  </dt>
                  <dd style={{ color: TEACHER_NAVY }}>
                    {data.activity.signedUpAt
                      ? formatSignedUpWhen(data.activity.signedUpAt)
                      : "Time not available"}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {data.activity.items.length > 0 ? (
            <ul className="space-y-2">
              {data.activity.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 text-sm"
                  style={{ borderColor: TEACHER_SILVER }}
                >
                  <div>
                    <p className="font-medium" style={{ color: TEACHER_NAVY }}>
                      {item.mealTypeLabel}
                      {item.sliceCount != null
                        ? ` · ${item.sliceCount} slice${item.sliceCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                    <p className="text-xs" style={{ color: TEACHER_SILVER }}>
                      {item.statusLabel}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold" style={{ color: TEACHER_NAVY }}>
                    {formatCurrency(item.price)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && data && data.upcoming.length > 0 ? (
        <div className="mt-4">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: TEACHER_SILVER }}
          >
            Upcoming
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.upcoming.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between text-sm"
                style={{ color: TEACHER_NAVY }}
              >
                <span>
                  {formatUpcomingDate(item.date)} · {item.mealTypeLabel}
                </span>
                <span className="text-xs" style={{ color: TEACHER_SILVER }}>
                  {item.statusLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
