"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { GroupedOptionNav } from "@/components/nav/GroupedOptionNav"
import { STUDENT_NAV_CATEGORIES } from "@/components/student/student-nav-groups"
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

  const loadMe = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch("/api/student/me", {
        headers: { "x-session-user-id": user.id },
        cache: "no-store",
      })
      const data = (await res.json().catch(() => ({}))) as {
        student?: StudentMe
        error?: string
      }
      if (!res.ok || !data.student) {
        setError(data.error ?? "Unable to load your student profile")
        return
      }
      setError(null)
      setMe(data.student)
    } catch {
      setError("Unable to load your student profile")
    }
  }, [user])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  useEffect(() => {
    if (!user) return
    const refresh = () => {
      if (document.visibilityState === "visible") void loadMe()
    }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [user, loadMe])

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

      <GroupedOptionNav
        categories={STUDENT_NAV_CATEGORIES}
        heading="What do you need?"
        layout="stack"
      />
    </div>
  )
}
