"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarDays, UtensilsCrossed } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { formatCurrency } from "@/lib/utils"

type StudentMe = {
  externalId: string
  firstName: string
  lastName: string
  grade: string
  balance: number
}

export default function StudentHomePage() {
  const { user } = useAuth()
  const [me, setMe] = useState<StudentMe | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/student/me", {
          headers: { "x-session-user-id": user!.id },
        })
        const data = (await res.json().catch(() => ({}))) as {
          student?: StudentMe
          error?: string
        }
        if (cancelled) return
        if (!res.ok || !data.student) {
          setError(data.error ?? "Unable to load your student profile")
          return
        }
        setMe(data.student)
      } catch {
        if (!cancelled) setError("Unable to load your student profile")
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#041B52]">
          Hi{me ? `, ${me.firstName}` : user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Order school lunch for yourself. Parents add lunch money and manage photos in the Parent
          Portal.
        </p>
      </section>

      {error ? (
        <p className="rounded-xl border border-[#D62828]/30 bg-[#D62828]/5 px-4 py-3 text-sm text-[#D62828]">
          {error}
        </p>
      ) : null}

      {me ? (
        <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Your lunch account</p>
          <p className="mt-1 text-lg font-semibold text-[#041B52]">
            {me.firstName} {me.lastName}
          </p>
          <p className="text-sm text-[#64748B]">
            MD ID {me.externalId} · Grade {me.grade}
          </p>
          <p className="mt-4 text-sm text-[#64748B]">Balance (view only)</p>
          <p className="text-2xl font-bold text-[#041B52]">{formatCurrency(me.balance)}</p>
          <p className="mt-2 text-xs text-[#64748B]">
            Need money on your account? Ask a parent or Mrs. Dalfol at the office — this portal
            cannot add funds.
          </p>
        </section>
      ) : !error ? (
        <p className="text-sm text-[#64748B]">Loading your account...</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/student/order"
          className="flex min-h-[5.5rem] flex-col justify-center gap-2 rounded-2xl bg-[#041B52] px-5 py-4 text-white"
        >
          <UtensilsCrossed className="h-5 w-5" aria-hidden />
          <span className="text-lg font-bold">Order lunch</span>
          <span className="text-sm text-white/80">Pick a menu day and meal</span>
        </Link>
        <Link
          href="/student/orders"
          className="flex min-h-[5.5rem] flex-col justify-center gap-2 rounded-2xl border border-[#C8CDD7] bg-white px-5 py-4 text-[#041B52]"
        >
          <CalendarDays className="h-5 w-5" aria-hidden />
          <span className="text-lg font-bold">My orders</span>
          <span className="text-sm text-[#64748B]">Upcoming and saved lunches</span>
        </Link>
      </div>
    </div>
  )
}
