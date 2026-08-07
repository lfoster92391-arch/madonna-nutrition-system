"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"

export type SearchableStudent = {
  id: string
  firstName: string
  lastName: string
  grade: string
  homeroom?: string | null
}

export function ParentStudentLinkPicker({
  selectedId,
  onSelect,
  excludeIds = [],
  heading = "Find your child",
  searchUrl = "/api/auth/parent/search-students",
  helperText = "At least one student is required. You can add siblings after the first child.",
}: {
  selectedId: string | null
  onSelect: (student: SearchableStudent) => void
  excludeIds?: string[]
  heading?: string
  searchUrl?: string
  helperText?: string
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchableStudent[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const excluded = new Set(excludeIds)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timer = window.setTimeout(async () => {
      setBusy(true)
      setError(null)
      try {
        const res = await fetch(`${searchUrl}?q=${encodeURIComponent(q)}`)
        const data = (await res.json().catch(() => ({}))) as {
          students?: SearchableStudent[]
          error?: string
        }
        if (!res.ok) {
          setError(data.error ?? "Search failed. Try again.")
          setResults([])
          return
        }
        const filtered = (data.students ?? []).filter((s) => !excluded.has(s.id))
        setResults(filtered)
        if (filtered.length === 0) {
          setError("No students matched. Try a different name or MD ID.")
        }
      } catch {
        setError("Could not search students. Check your connection.")
        setResults([])
      } finally {
        setBusy(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, excludeIds.join("|"), searchUrl])

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="parent-student-search">{heading}</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            id="parent-student-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Student name or MD ID"
            className="h-12 pl-10"
            autoComplete="off"
          />
        </div>
        {helperText ? (
          <p className="mt-2 text-xs text-[#64748B]">{helperText}</p>
        ) : null}
      </div>

      {busy && <p className="text-sm text-[#64748B]">Searching…</p>}
      {error && !busy && <p className="text-sm text-danger">{error}</p>}

      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {results.map((student) => {
          const selected = selectedId === student.id
          return (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => onSelect(student)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#00A83E] bg-[#00A83E]/10"
                    : "border-[#C8CDD7] hover:border-[#001E62]/40"
                }`}
              >
                <span>
                  <span className="block font-semibold text-[#001E62]">
                    {student.firstName} {student.lastName}
                  </span>
                  <span className="block text-xs text-[#64748B]">
                    MD ID {student.id} · Grade {student.grade}
                    {student.homeroom ? ` · ${student.homeroom}` : ""}
                  </span>
                </span>
                {selected ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-[#00A83E]">
                    <CheckCircle2 className="h-4 w-4" />
                    This is my child
                  </span>
                ) : (
                  <span className="text-sm font-medium text-[#001E62]">Select</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function LinkedStudentChips({
  students,
  onRemove,
}: {
  students: SearchableStudent[]
  onRemove?: (id: string) => void
}) {
  if (students.length === 0) return null
  return (
    <ul className="space-y-2">
      {students.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between rounded-xl border border-[#00A83E]/40 bg-[#00A83E]/5 px-3 py-2"
        >
          <span className="text-sm font-semibold text-[#001E62]">
            {s.firstName} {s.lastName}{" "}
            <span className="font-normal text-[#64748B]">(MD {s.id})</span>
          </span>
          {onRemove && (
            <button
              type="button"
              className="rounded-lg p-1 text-[#64748B] hover:bg-white hover:text-[#D62828]"
              aria-label={`Remove ${s.firstName}`}
              onClick={() => onRemove(s.id)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export function AddAnotherChildButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={disabled}>
      Add another child
    </Button>
  )
}
