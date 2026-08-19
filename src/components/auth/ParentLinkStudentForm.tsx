"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers/AuthProvider"
import { BRAND } from "@/config/brand"
import { Button } from "@/components/ui/button"
import {
  AddAnotherChildButton,
  LinkedStudentChips,
  ParentStudentLinkPicker,
  type SearchableStudent,
} from "@/components/auth/ParentStudentLinkPicker"

const NAVY = "#001E62"

async function linkOne(
  userId: string,
  studentExternalId: string
): Promise<{ ok: true; studentName: string } | { ok: false; error: string }> {
  const res = await fetch("/api/auth/parent/link-student", {
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

export function ParentLinkStudentForm({
  allowSkipToPortal = false,
}: {
  /** When parent already has ≥1 linked student (settings / add sibling). */
  allowSkipToPortal?: boolean
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, logout, clearNeedsStudentLink, appendLinkedStudentId } = useAuth()
  const [linked, setLinked] = useState<SearchableStudent[]>([])
  const [pendingSelect, setPendingSelect] = useState<SearchableStudent | null>(null)
  const [addingAnother, setAddingAnother] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const hasRequiredLink = linked.length > 0 || allowSkipToPortal
  const showPicker = linked.length === 0 || addingAnother

  async function confirmAndLink() {
    setError("")
    setMessage("")
    if (!user?.id) {
      setError("Sign in again to link your student.")
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
      setMessage(`${result.studentName} is now linked.`)
      appendLinkedStudentId(pendingSelect.id)
      clearNeedsStudentLink()
      void queryClient.invalidateQueries({ queryKey: ["users"] })
      void queryClient.invalidateQueries({ queryKey: ["students"] })
    } catch {
      setError("Could not link student. Try again.")
    } finally {
      setBusy(false)
    }
  }

  function goToPortal() {
    if (!hasRequiredLink && !allowSkipToPortal) {
      setError("Link at least one student before opening the portal.")
      return
    }
    clearNeedsStudentLink()
    router.replace("/parent")
  }

  return (
    <div className="w-full max-w-lg rounded-[20px] border border-[#C8CDD7]/60 bg-white p-8 shadow-lg shadow-[#001E62]/5">
      <div className="mb-6 text-center">
        <Image
          src="/brand-logo.png"
          alt={BRAND.productName}
          width={160}
          height={42}
          priority
          className="mx-auto mb-4 h-10 w-auto object-contain"
        />
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          {allowSkipToPortal ? "Add another child" : "Link your student"}
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          {allowSkipToPortal
            ? "Search for a sibling and connect them to this parent account."
            : "At least one student is required. You can add more siblings after the first."}
        </p>
      </div>

      <div className="space-y-4">
        {linked.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold" style={{ color: NAVY }}>
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

        {(linked.length > 0 || allowSkipToPortal) && (
          <Button
            type="button"
            size="lg"
            className="h-14 w-full text-base"
            onClick={goToPortal}
            disabled={busy || (linked.length === 0 && !allowSkipToPortal)}
          >
            Continue to parent portal
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-[#64748B]">
        <button
          type="button"
          className="font-semibold hover:underline"
          style={{ color: NAVY }}
          onClick={() => {
            logout()
            router.replace("/login/parent")
          }}
        >
          Sign out
        </button>
        <Link href="/" className="hover:underline" style={{ color: NAVY }}>
          Back to portal selection
        </Link>
      </div>
    </div>
  )
}
