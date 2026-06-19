"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  TEACHER_BG,
  TEACHER_NAVY,
  TEACHER_RAIL_STORAGE_KEY,
  TEACHER_SILVER,
} from "@/components/teacher/layout/teacher-theme"

const STATUS_LABELS = {
  using_account: "Account",
  prepaid: "Prepaid",
  pay_at_kiosk: "Kiosk",
  low_funds: "Low Funds",
} as const

function formatSignedUpTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function TeacherLunchActivityPanel() {
  const { signups, reservation } = useTeacherData()
  const [expanded, setExpanded] = useState(true)
  const todayMeal = reservation?.mealName ?? "Today's Lunch"

  useEffect(() => {
    const stored = localStorage.getItem(TEACHER_RAIL_STORAGE_KEY)
    if (stored !== null) setExpanded(stored === "true")
  }, [])

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(TEACHER_RAIL_STORAGE_KEY, String(next))
      return next
    })
  }

  if (!expanded) {
    return (
      <div
        className="flex w-10 shrink-0 flex-col items-center border-l py-4"
        style={{ borderColor: TEACHER_SILVER, backgroundColor: "#FFFFFF" }}
      >
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-2xl transition hover:bg-[#0A1E3F]/5"
          aria-label="Expand lunch sign-ups panel"
        >
          <ChevronLeft className="h-4 w-4" style={{ color: TEACHER_NAVY }} />
        </button>
      </div>
    )
  }

  return (
    <aside
      className="flex w-80 shrink-0 flex-col border-l"
      style={{ borderColor: TEACHER_SILVER, backgroundColor: "#FFFFFF" }}
    >
      <div
        className="flex h-12 items-center justify-between border-b px-4"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4" style={{ color: TEACHER_NAVY }} />
          <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: TEACHER_NAVY }}>
            Today&apos;s Lunch Sign-Ups
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="flex h-7 w-7 items-center justify-center rounded-xl transition hover:bg-[#0A1E3F]/5"
          aria-label="Collapse lunch sign-ups panel"
        >
          <ChevronRight className="h-4 w-4" style={{ color: TEACHER_NAVY }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-4 text-xs" style={{ color: TEACHER_SILVER }}>
          {signups.length} student{signups.length === 1 ? "" : "s"} signed up
        </p>
        <ul className="space-y-3">
          {signups.map((signup) => (
            <li
              key={signup.id}
              className="rounded-2xl border p-3"
              style={{ borderColor: TEACHER_SILVER, backgroundColor: TEACHER_BG }}
            >
              <div className="flex items-start gap-3">
                <Image
                  src={signup.photo}
                  alt={signup.studentName}
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: TEACHER_NAVY }}>
                    {signup.studentName}
                  </p>
                  <p className="text-xs" style={{ color: TEACHER_SILVER }}>
                    Grade {signup.grade} · {formatSignedUpTime(signup.signedUpAt)}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium" style={{ color: TEACHER_NAVY }}>
                    {todayMeal}
                  </p>
                  <Badge
                    variant={signup.status === "low_funds" ? "warning" : "outline"}
                    className={cn(
                      "mt-2 text-[10px]",
                      signup.status === "low_funds" && "bg-warning/15 text-warning",
                      signup.status === "prepaid" && "text-success"
                    )}
                  >
                    {STATUS_LABELS[signup.status]}
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {signups.length === 0 ? (
          <p className="text-center text-sm" style={{ color: TEACHER_SILVER }}>
            No lunch sign-ups yet today.
          </p>
        ) : null}
      </div>
    </aside>
  )
}
