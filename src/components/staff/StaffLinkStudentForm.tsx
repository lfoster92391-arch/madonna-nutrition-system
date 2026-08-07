"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  AddAnotherChildButton,
  LinkedStudentChips,
  ParentStudentLinkPicker,
  type SearchableStudent,
} from "@/components/auth/ParentStudentLinkPicker"
import { STAFF_NAVY } from "@/components/staff/layout/staff-theme"

async function linkOne(
  userId: string,
  studentExternalId: string
): Promise<{ ok: true; studentName: string } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/staff/link-student", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-user-id": userId,
    },
    body: JSON.stringify({
      studentExternalId,
      relationship: "Guardian",
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean
    error?: string
    studentName?: string
  }
  if (!res.ok || !data.success) {
    return { ok: false, error: data.error ?? "Could not link student." }
  }
  return { ok: true, studentName: data.studentName ?? "Student" }
}

export function StaffLinkStudentForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [linked, setLinked] = useState<SearchableStudent[]>([])
  const [pendingSelect, setPendingSelect] = useState<SearchableStudent | null>(null)
  const [addingAnother, setAddingAnother] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const showPicker = linked.length === 0 || addingAnother

  async function confirmAndLink() {
    setError("")
    setMessage("")
    if (!user?.id) {
      setError("Sign in again to link your child.")
      return
    }
    if (!pendingSelect) {
      setError("Select your child first.")
      return
    }

    setBusy(true)
    try {
      const result = await linkOne(user.id, pendingSelect.id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setLinked((prev) =>
        prev.some((s) => s.id === pendingSelect.id) ? prev : [...prev, pendingSelect]
      )
      setPendingSelect(null)
      setAddingAnother(false)
      setMessage(`${result.studentName} is now linked to your staff account.`)
    } catch {
      setError("Could not link student. Try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="w-full max-w-lg rounded-[20px] border bg-white p-6 shadow-sm sm:p-8"
      style={{ borderColor: "#C8CDD7" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          Add your child
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Search by name or MD ID, then link them to this staff account. You can add more than one
          child.
        </p>
      </div>

      <div className="space-y-4">
        {linked.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold" style={{ color: STAFF_NAVY }}>
              Linked this session ({linked.length})
            </p>
            <LinkedStudentChips students={linked} />
          </div>
        )}

        {showPicker ? (
          <>
            <ParentStudentLinkPicker
              selectedId={pendingSelect?.id ?? null}
              onSelect={setPendingSelect}
              excludeIds={linked.map((s) => s.id)}
              heading={linked.length === 0 ? "Find your child" : "Find another child"}
              helperText="Search by student name or MD ID."
            />
            <Button
              type="button"
              size="lg"
              className="h-14 w-full text-base"
              disabled={busy || !pendingSelect}
              onClick={() => void confirmAndLink()}
            >
              {busy
                ? "Linking…"
                : pendingSelect
                  ? `Link ${pendingSelect.firstName}`
                  : "Select a student"}
            </Button>
            {linked.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setAddingAnother(false)
                  setPendingSelect(null)
                }}
              >
                Done adding children
              </Button>
            )}
          </>
        ) : (
          <AddAnotherChildButton onClick={() => setAddingAnother(true)} disabled={busy} />
        )}

        {message && <p className="text-sm font-medium text-[#00A83E]">{message}</p>}
        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        {linked.length > 0 && (
          <Button
            type="button"
            size="lg"
            className="h-14 w-full text-base"
            onClick={() => router.replace("/staff/account")}
            disabled={busy}
          >
            View child balances
          </Button>
        )}

        <div className="pt-2 text-center text-sm text-[#64748B]">
          <Link href="/staff/settings" className="font-semibold hover:underline" style={{ color: STAFF_NAVY }}>
            Back to Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
