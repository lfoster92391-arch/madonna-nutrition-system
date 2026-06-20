"use client"

import { useEffect, useState } from "react"
import { CreditCard, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TEACHER_NAVY } from "@/config/teacher-theme"

const BANNER_TEXT =
  "Reminder: Bring your lunch badge to the cafeteria. Please remind students to bring theirs as well and pay before or at the kiosk."

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function TeacherPortalBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = `mnms-teacher-banner-dismissed-${todayKey()}`
    setVisible(localStorage.getItem(key) !== "true")
  }, [])

  function dismiss() {
    localStorage.setItem(`mnms-teacher-banner-dismissed-${todayKey()}`, "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 px-8 py-4 text-white"
      style={{ backgroundColor: TEACHER_NAVY }}
    >
      <div className="flex items-start gap-3">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 opacity-90" />
        <p className="max-w-4xl text-sm leading-relaxed">{BANNER_TEXT}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={dismiss}
          className="border-white/40 bg-white/10 text-white hover:bg-white/20"
        >
          Dismiss for Today
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1 hover:bg-white/10"
          aria-label="Dismiss banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
