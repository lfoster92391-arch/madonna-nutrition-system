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
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { exportRowsToCsv, getTemplate } from "@/lib/import-export"
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

function normalizeCsvRow(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/^\ufeff/, "").trim()] = value?.trim() ?? ""
  }
  return out
}

function pickCsvField(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value) return value
  }
  const normalized = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/[_\s-]/g, ""), v])
  )
  for (const key of keys) {
    const value = normalized[key.toLowerCase().replace(/[_\s-]/g, "")]
    if (value) return value
  }
  return ""
}

function normalizeBadgeStatus(raw?: string): Student["badgeStatus"] {
  const value = raw?.trim().toLowerCase()
  if (value === "active" || value === "inactive") return value
  return "pending"
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
  const [importErrors, setImportErrors] = useState<Array<{ row: number; message: string }>>([])

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

  const handlePrint = () => {
    const template = getTemplate("badges")
    exportRowsToCsv("badges", exportRows)
    window.print()
  }

  const handleImportFile = async (file: File) => {
    if (!user?.id) {
      setImportSummary("Sign in as an admin to import badges.")
      return
    }
    setImportSummary(null)
    setImportErrors([])

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data
          .map((raw) => {
            const row = normalizeCsvRow(raw)
            return {
              mdId: pickCsvField(row, "mdId", "MD ID", "md_id", "MDID"),
              firstName: pickCsvField(row, "firstName", "First Name", "first_name"),
              lastName: pickCsvField(row, "lastName", "Last Name", "last_name"),
              grade: pickCsvField(row, "grade", "Grade"),
              photoUrl: pickCsvField(row, "photoUrl", "Photo URL", "photo_url") || undefined,
              badgeStatus: normalizeBadgeStatus(
                pickCsvField(row, "badgeStatus", "Badge Status", "badge_status")
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
          })
          setImportSummary(
            `Matched ${summary.matched}, updated ${summary.updated}, created ${summary.created}, skipped ${summary.skipped}.`
          )
          setImportErrors(summary.errors)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[220px] flex-1">
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
          className="w-40"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Export / Print
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IdCard className="h-5 w-5" />
            Badge Roster ({filtered.length})
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto px-6 pb-6">
          {isLoading ? (
            <p className="text-sm text-silver-foreground">Loading badges…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-silver-foreground">
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
                    <td className="py-3 pr-4">
                      <Image
                        src={student.photo}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
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
                      <Button size="sm" variant="outline" onClick={() => openAssign(student)}>
                        Assign
                      </Button>
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
            <CardTitle className="text-base">Assign badge — MD ID {assignMdId}</CardTitle>
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
            <h3 className="font-semibold text-primary">Bulk badge import</h3>
            <p className="text-sm text-silver-foreground">
              Upload the badge enrollment CSV template to link barcodes and set status.
            </p>
          </div>
          <ImportExportMenu type="badges" onImport={scrollToImport} exportRows={exportRows} />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImportFile(file)
            e.target.value = ""
          }}
        />
        <Button variant="outline" className="mt-4" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Choose CSV file
        </Button>
        {importSummary && (
          <div
            className={cn(
              "mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm",
              importErrors.length > 0
                ? "border-warning/40 bg-warning/5"
                : "border-success/40 bg-success/5"
            )}
          >
            {importErrors.length > 0 ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            )}
            <div>
              <p>{importSummary}</p>
              {importErrors.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-silver-foreground">
                  {importErrors.slice(0, 10).map((err) => (
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
