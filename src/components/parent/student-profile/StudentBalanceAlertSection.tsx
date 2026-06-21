"use client"

import { useEffect, useState } from "react"
import { BellOff, Check, Pencil } from "lucide-react"
import { PreferenceToggle } from "@/components/parent/PreferenceToggle"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import {
  DEFAULT_LOW_BALANCE_THRESHOLD,
  getStudentThreshold,
  isAlertsPaused,
  setAlertsPaused,
  setStudentThreshold,
} from "@/lib/parent-balance-alerts"
import {
  fetchServerNotificationPrefs,
  patchServerNotificationPrefs,
} from "@/lib/parent-notification-sync"
import { formatCurrency } from "@/lib/utils"

type StudentBalanceAlertSectionProps = {
  studentId: string
  balance: number
}

export function StudentBalanceAlertSection({ studentId, balance }: StudentBalanceAlertSectionProps) {
  const [threshold, setThreshold] = useState(DEFAULT_LOW_BALANCE_THRESHOLD)
  const [paused, setPaused] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftThreshold, setDraftThreshold] = useState(String(DEFAULT_LOW_BALANCE_THRESHOLD))

  useEffect(() => {
    setThreshold(getStudentThreshold(studentId))
    setPaused(isAlertsPaused(studentId))
    setDraftThreshold(String(getStudentThreshold(studentId)))

    void fetchServerNotificationPrefs().then((server) => {
      if (!server) return
      const serverThreshold = server.studentThresholds?.[studentId]
      if (typeof serverThreshold === "number") {
        setThreshold(serverThreshold)
        setDraftThreshold(String(serverThreshold))
        setStudentThreshold(studentId, serverThreshold)
      }
      const serverPaused = server.pausedStudents?.includes(studentId) ?? false
      setPaused(serverPaused)
      setAlertsPaused(studentId, serverPaused)
    })
  }, [studentId])

  function saveThreshold() {
    const parsed = Number.parseFloat(draftThreshold)
    if (Number.isNaN(parsed) || parsed < 0) return
    setStudentThreshold(studentId, parsed)
    setThreshold(parsed)
    setEditing(false)
    void patchServerNotificationPrefs({
      studentThresholds: { [studentId]: parsed },
    })
  }

  function togglePause(next: boolean) {
    setAlertsPaused(studentId, next)
    setPaused(next)
    void fetchServerNotificationPrefs().then((server) => {
      const current = server?.pausedStudents ?? []
      const pausedStudents = next
        ? [...new Set([...current, studentId])]
        : current.filter((id) => id !== studentId)
      void patchServerNotificationPrefs({ pausedStudents })
    })
  }

  const belowThreshold = !paused && balance < threshold

  return (
    <div className="mt-8 border-t border-silver/40 pt-8">
      <h3 className="mb-1 text-lg font-bold text-primary">Balance &amp; Alerts</h3>
      <p className="mb-4 text-sm text-silver-foreground">
        Manage low-balance notifications for this student.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[14px] border border-silver/60 bg-silver/5 p-4">
          <p className="text-sm text-silver-foreground">Current Balance</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
          {belowThreshold && (
            <p className="mt-2 text-sm font-medium text-danger">Below alert threshold</p>
          )}
        </div>

        <div className="rounded-[14px] border border-silver/60 bg-silver/5 p-4">
          <p className="text-sm text-silver-foreground">Low Balance Threshold</p>
          {editing ? (
            <div className="mt-2 space-y-2">
              <Label htmlFor="threshold-input" className="sr-only">
                Threshold amount
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-silver-foreground">Notify below</span>
                <Input
                  id="threshold-input"
                  type="number"
                  min={0}
                  step={1}
                  value={draftThreshold}
                  onChange={(e) => setDraftThreshold(e.target.value)}
                  className="h-9 w-24"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveThreshold}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1 text-lg font-semibold text-primary">
                Notify below {formatCurrency(threshold)}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5"
                onClick={() => {
                  setDraftThreshold(String(threshold))
                  setEditing(true)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Threshold
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-silver/60 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          {paused ? (
            <>
              <BellOff className="h-4 w-4 text-silver-foreground" />
              Alerts paused for this student
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-success" />
              Notifications enabled
            </>
          )}
        </div>
        <div className="mt-3">
          <PreferenceToggle
            label="Pause low balance alerts"
            description="Temporarily stop notifications for this student."
            checked={paused}
            onChange={togglePause}
          />
        </div>
      </div>
    </div>
  )
}
