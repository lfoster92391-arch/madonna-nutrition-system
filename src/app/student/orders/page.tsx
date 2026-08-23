"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

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

export default function StudentOrdersPage() {
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
      const res = await fetch("/api/lunch-reservations", {
        headers: { "x-session-user-id": user.id },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? "Unable to load your orders")
        setReservations([])
        return
      }
      const data = (await res.json()) as { reservations?: ReservationRow[] }
      setReservations(data.reservations ?? [])
    } catch {
      setError("Unable to load your orders")
    } finally {
      setLoading(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void load()
  }, [load])

  const upcoming = reservations.filter((r) => r.status === "RESERVED")

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#041B52]">My orders</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Upcoming and saved lunch orders for you only.
        </p>
      </section>

      <Button asChild className="w-full sm:w-auto">
        <Link href="/student/order">Order lunch</Link>
      </Button>

      {loading ? <p className="text-sm text-[#64748B]">Loading...</p> : null}
      {error ? <p className="text-sm text-[#D62828]">{error}</p> : null}

      {!loading && !error ? (
        <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5 sm:p-6">
          {upcoming.length === 0 ? (
            <p className="text-sm text-[#64748B]">No upcoming lunch orders.</p>
          ) : (
            <ul className="divide-y divide-[#E2E8F0]">
              {upcoming.map((row) => (
                <li key={row.id} className="py-3 text-sm">
                  <p className="font-medium text-[#041B52]">{row.date}</p>
                  <p className="text-[#64748B]">
                    {row.mealType.replace(/_/g, " ")}
                    {row.sliceCount
                      ? ` · ${row.sliceCount} ${row.sliceCount === 1 ? "slice" : "slices"}`
                      : ""}{" "}
                    · {formatCurrency(row.totalAmount ?? row.price)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
