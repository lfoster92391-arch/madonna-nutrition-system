"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Papa from "papaparse"
import Image from "next/image"
import {
  AlertCircle,
  CheckCircle2,
  IdCard,
  Printer,
  Search,
  Upload,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { BadgeMassPrint } from "@/components/admin/BadgeMassPrint"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { studentHasRealPhoto } from "@/components/admin/StudentBadgeCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { exportRowsToCsv } from "@/lib/import-export"
import {
  assertCsvFile,
  normalizeBadgeStatusValue,
  normalizeCsvRecord,
  pickCsvField,
} from "@/lib/import-export/coerce"
import { api } from "@/lib/api/client"
import type { Student } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_VARIANT: Record<
  NonNullable<Student["badgeStatus"]>,
  "default" | "warning" | "success" | "danger"
> = {
  active: "success",
  pending: "warning",
  inactive: "danger",
}

async function fetchBadges(): Promise<Student[]> {
  const res = await fetch("/api/badges")
  if (!res.ok) throw new Error("Failed to load badges")
  return res.json()
}

export function BadgeManager() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const importRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Student["badgeStatus"]>("all")
  const [assignMdId, setAssignMdId] = useState<string | null>(null)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [statusInput, setStatusInput] = useState<Student["badgeStatus"]>("active")
  const [importSummary, setImportSummary] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<
    Array<{ row: number; message: string; incomplete?: boolean }>
  >([])
  const [incompleteRows, setIncompleteRows] = useState<
    Array<{
      row: number
      mdId: string
      firstName: string
      lastName: string
      grade: string
      missing: string[]
    }>
  >([])
  const [createIncompleteStubs, setCreateIncompleteStubs] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [printMode, setPrintMode] = useState(false)

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ["badges"],
    queryFn: fetchBadges,
  })

  const assignMutation = useMutation({
    mutationFn: async (payload: { mdId: string; barcode?: string; badgeStatus: Student["badgeStatus"] }) => {
      const res = await fetch(`/api/badges/${encodeURIComponent(payload.mdId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: payload.barcode || payload.mdId,
          badgeStatus: payload.badgeStatus,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Failed to assign badge")
      }
      return res.json() as Promise<Student>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["badges"] })
      void queryClient.invalidateQueries({ queryKey: ["students"] })
      setAssignMdId(null)
      setBarcodeInput("")
    },
  })

  const filtered = useMemo(() => {
    return badges.filter((s) => {
      if (statusFilter !== "all" && s.badgeStatus !== statusFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.id.includes(q) ||
        (s.barcode ?? "").includes(q)
      )
    })
  }, [badges, search, statusFilter])

  const selectedStudents = useMemo(
    () => badges.filter((s) => selectedIds.has(s.id)),
    [badges, selectedIds]
  )

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id))

  const exportRows = useMemo(
    () =>
      badges.map((s) => ({
        mdId: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        grade: s.grade,
        photoUrl: s.photo,
        badgeStatus: s.badgeStatus ?? "pending",
        barcode: s.barcode ?? s.id,
      })),
    [badges]
  )

  const scrollToImport = useCallback(() => {
    importRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    fileRef.current?.click()
  }, [])

  const handleExportCsv = () => {
    exportRowsToCsv("badges", exportRows)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const s of filtered) next.delete(s.id)
      } else {
        for (const s of filtered) next.add(s.id)
      }
      return next
    })
  }

  const openPrintPreview = (ids?: Set<string>) => {
    if (ids) setSelectedIds(ids)
    setPrintMode(true)
  }

  const handleImportFile = async (file: File) => {
    if (!user?.id) {
      setImportSummary("Sign in as an admin to import badges.")
      return
    }
    const csvError = assertCsvFile(file)
    if (csvError) {
      setImportSummary(csvError)
      setImportErrors([])
      setIncompleteRows([])
      return
    }
    setImportSummary(null)
    setImportErrors([])
    setIncompleteRows([])

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data
          .map((raw) => {
            const row = normalizeCsvRecord(raw)
            return {
              mdId: pickCsvField(row, "mdId", "MD ID", "md_id", "MDID"),
              firstName: pickCsvField(row, "firstName", "First Name", "first_name"),
              lastName: pickCsvField(row, "lastName", "Last Name", "last_name"),
              grade: pickCsvField(row, "grade", "Grade"),
              photoUrl: pickCsvField(row, "photoUrl", "Photo URL", "photo_url") || undefined,
              badgeStatus: normalizeBadgeStatusValue(
                pickCsvField(row, "badgeStatus", "Badge Status", "badge_status"),
                "pending"
              ),
              barcode: pickCsvField(row, "barcode", "Barcode") || undefined,
            }
          })
          .filter((row) => row.mdId.trim())

        if (rows.length === 0) {
          setImportSummary("No valid rows found. Check that the CSV has an MD ID column.")
          return
        }

        try {
          const summary = await api.adminImportBadges({
            adminUserId: user.id,
            rows,
            createIncompleteStubs,
          })
          const incompleteCount = summary.incomplete?.length ?? 0
          setImportSummary(
            `Matched ${summary.matched}, updated ${summary.updated}, created ${summary.created}, skipped ${summary.skipped}` +
              (incompleteCount > 0
                ? `. ${incompleteCount} incomplete — edit individually below or in the list above.`
                : ".")
          )
          setImportErrors(summary.errors)
          setIncompleteRows(summary.incomplete ?? [])
          void queryClient.invalidateQueries({ queryKey: ["badges"] })
          void queryClient.invalidateQueries({ queryKey: ["students"] })
        } catch (error) {
          setImportSummary(error instanceof Error ? error.message : "Import failed")
        }
      },
    })
  }

  function openAssign(student: Student) {
    setAssignMdId(student.id)
    setBarcodeInput(student.barcode ?? student.id)
    setStatusInput(student.badgeStatus ?? "pending")
  }

  if (printMode) {
    return (
      <BadgeMassPrint
        students={selectedStudents}
        onClose={() => setPrintMode(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 max-w-xl">
            <h2 className="text-base font-bold text-primary sm:text-lg">Print student badges</h2>
            <p className="mt-1 text-sm text-silver-foreground">
              Select students below (or use the filtered list), then preview printable badge
              cards with photo, name, email, grade, barcode, and MD ID.
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              {selectedIds.size === 0
                ? "No students selected yet."
                : `${selectedIds.size} student${selectedIds.size === 1 ? "" : "s"} selected.`}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              variant="outline"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() =>
                openPrintPreview(new Set(filtered.map((s) => s.id)))
              }
              disabled={filtered.length === 0}
            >
              Print filtered ({filtered.length})
            </Button>
            <Button
              size="lg"
              className="min-h-11 flex-1 sm:flex-none"
              onClick={() => openPrintPreview()}
              disabled={selectedIds.size === 0}
            >
              <Printer className="mr-2 h-5 w-5" />
              Print student badges
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full min-w-0 flex-1 sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, MD ID, or barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="w-full sm:w-40"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportCsv}>
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="h-5 w-5" />
              Badge Roster ({filtered.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={toggleSelectAllFiltered} disabled={filtered.length === 0}>
              {allFilteredSelected ? "Clear selection" : "Select all filtered"}
            </Button>
          </div>
        </CardHeader>
        <div className="mobile-scroll-x px-3 pb-6 sm:px-6">
          {isLoading ? (
            <p className="text-sm text-silver-foreground">Loading badges…</p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-silver-foreground">
                  <th className="pb-3 pr-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      aria-label="Select all filtered students"
                    />
                  </th>
                  <th className="pb-3 pr-4">Photo</th>
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4">MD ID</th>
                  <th className="pb-3 pr-4">Barcode</th>
                  <th className="pb-3 pr-4">Grade</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id} className="border-b border-silver/40">
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        aria-label={`Select ${student.firstName} ${student.lastName}`}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      {studentHasRealPhoto(student.photo) ? (
                        <Image
                          src={student.photo}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                          unoptimized={student.photo.startsWith("data:")}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-silver/30 text-[9px] font-semibold uppercase text-silver-foreground">
                          No photo
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="py-3 pr-4 font-mono">{student.id}</td>
                    <td className="py-3 pr-4 font-mono">{student.barcode ?? student.id}</td>
                    <td className="py-3 pr-4">{student.grade}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={STATUS_VARIANT[student.badgeStatus ?? "pending"]}>
                        {(student.badgeStatus ?? "pending").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openAssign(student)}>
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPrintPreview(new Set([student.id]))}
                        >
                          Print
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {assignMdId && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Assign badge - MD ID {assignMdId}</CardTitle>
          </CardHeader>
          <div className="grid gap-4 px-6 pb-6 sm:grid-cols-3">
            <div>
              <Label>Barcode number</Label>
              <Input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Numeric barcode"
              />
              <p className="mt-1 text-xs text-silver-foreground">
                Usually matches MD ID unless the physical badge differs.
              </p>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value as Student["badgeStatus"])}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() =>
                  assignMutation.mutate({
                    mdId: assignMdId,
                    barcode: barcodeInput,
                    badgeStatus: statusInput!,
                  })
                }
                disabled={assignMutation.isPending || !barcodeInput.trim()}
              >
                Save
              </Button>
              <Button variant="ghost" onClick={() => setAssignMdId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div ref={importRef} className="rounded-2xl border border-silver/60 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary">Import badges from a file</h3>
            <p className="text-sm text-silver-foreground">
              Upload a badge enrollment CSV (not Excel). Complete rows import immediately; incomplete
              rows (missing name/grade) can be skipped or created as stubs for individual edit.
            </p>
          </div>
          <ImportExportMenu type="badges" onImport={scrollToImport} exportRows={exportRows} />
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-primary">
          <input
            type="checkbox"
            className="mt-1"
            checked={createIncompleteStubs}
            onChange={(e) => setCreateIncompleteStubs(e.target.checked)}
          />
          <span>
            Create incomplete students as stubs so I can edit them individually after import
            (recommended). Uncheck to skip incomplete rows entirely.
          </span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImportFile(file)
            e.target.value = ""
          }}
        />
        <Button variant="outline" className="mt-4" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Pick a CSV file
        </Button>
        {importSummary && (
          <div
            className={cn(
              "mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm",
              importErrors.length > 0 || incompleteRows.length > 0
                ? "border-warning/40 bg-warning/5"
                : "border-success/40 bg-success/5"
            )}
          >
            {importErrors.length > 0 || incompleteRows.length > 0 ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            )}
            <div className="w-full space-y-3">
              <p>{importSummary}</p>
              {incompleteRows.length > 0 && (
                <div>
                  <p className="font-medium text-primary">
                    Incomplete — finish these individually (search MD ID above, then Assign / edit)
                  </p>
                  <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-4 text-silver-foreground">
                    {incompleteRows.map((row) => (
                      <li key={`${row.row}-${row.mdId}`}>
                        Row {row.row}: MD {row.mdId}
                        {row.firstName || row.lastName
                          ? ` — ${row.firstName} ${row.lastName}`.trim()
                          : ""}{" "}
                        (missing {row.missing.join(", ")})
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto px-2 py-0 text-primary"
                          onClick={() => {
                            setSearch(row.mdId)
                            setStatusFilter("all")
                            const match = badges.find((s) => s.id === row.mdId)
                            if (match) openAssign(match)
                          }}
                        >
                          Edit
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {importErrors.filter((e) => !e.incomplete).length > 0 && (
                <ul className="list-disc pl-4 text-silver-foreground">
                  {importErrors
                    .filter((e) => !e.incomplete)
                    .slice(0, 10)
                    .map((err) => (
                      <li key={`${err.row}-${err.message}`}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
