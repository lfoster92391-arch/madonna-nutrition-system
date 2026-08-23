"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ModuleShell } from "@/components/layout/ModuleShell"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  formatReservationConfirmation,
  formatReservationDetailLine,
  isActiveReservation,
} from "@/lib/parent-lunch-reservations"

interface ReservationRow {
  id: string
  studentId: string
  studentName: string
  date: string
  mealType: string
  price: number
  sliceCount?: number | null
  totalAmount?: number | null
  status: string
}

/** Saved meal selections for linked students (parent / dual-role). */
export default function ParentOrdersPage() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/lunch-reservations?parentUserId=${user.id}`, {
        headers: { "x-session-user-id": user.id },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? "Unable to load meal selections")
        setReservations([])
        return
      }
      const data = (await res.json()) as { reservations?: ReservationRow[] }
      setReservations(data.reservations ?? [])
    } catch {
      setError("Unable to load meal selections")
    } finally {
      setLoading(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void load()
  }, [load])

  const upcoming = reservations.filter((r) => isActiveReservation(r))

  return (
    <ModuleShell
      section="Parent Portal"
      title="My meal selections"
      description="Lunches you have already ordered for your linked students."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/parent/reserve-lunch">Order lunch</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/parent/calendar">Meal calendar</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/parent/guide">How-to guide</Link>
        </Button>
      </div>

      <Card className="rounded-[20px] border-[#AEB6C2]/60 p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-[#64748B]">Loading saved selections…</p>
        ) : error ? (
          <p className="text-sm text-[#D62828]">{error}</p>
        ) : upcoming.length === 0 ? (
          <div>
            <p className="font-semibold text-[#041B52]">No saved meal selections yet</p>
            <p className="mt-2 text-sm text-[#64748B]">
              When you order from Order Lunch or the meal calendar, your choices appear here with
              the date, meal type, and student name.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#AEB6C2]/40">
            {upcoming.map((row) => (
              <li key={row.id} className="py-4">
                <p className="font-semibold text-[#041B52]">
                  {formatReservationConfirmation({
                    studentName: row.studentName,
                    date: row.date,
                    mealType: row.mealType,
                    sliceCount: row.sliceCount,
                    totalAmount: row.totalAmount,
                    price: row.price,
                  })}
                </p>
                <p className="mt-1 text-sm text-[#64748B]">{formatReservationDetailLine(row)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ModuleShell>
  )
}
