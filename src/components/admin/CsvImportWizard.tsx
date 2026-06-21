"use client"

import { useCallback, useMemo, useState } from "react"
import Papa from "papaparse"
import { useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileUp,
  RotateCcw,
  Upload,
} from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { useAuth } from "@/components/providers/AuthProvider"
import { api } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { downloadImportTemplate, exportRowsToCsv } from "@/lib/import-export"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label, Select } from "@/components/ui/input"
import type { ImportLog, ParentContact, Student } from "@/lib/types"

const studentSchema = z.object({
  id: z.string().min(1).optional(),
  mdId: z.string().min(1).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  grade: z.string().min(1),
  homeroom: z.string().optional(),
  balance: z.coerce.number(),
  parentEmail: z.union([z.string().email(), z.literal("")]).optional(),
  parentPhone: z.string().optional(),
  photo: z.string().optional(),
  photoUrl: z.string().optional(),
  allergies: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
}).refine((d) => Boolean(d.id || d.mdId), { message: "mdId or id is required" })

type ImportStep = "upload" | "mapping" | "validation" | "preview" | "complete"
type FieldKey = "id" | "mdId" | "firstName" | "lastName" | "grade" | "homeroom" | "balance" | "parentEmail" | "parentPhone" | "photo" | "photoUrl" | "allergies" | "dietaryRestrictions"

const REQUIRED_FIELDS: FieldKey[] = ["mdId", "firstName", "lastName", "grade", "balance"]
const OPTIONAL_FIELDS: FieldKey[] = [
  "id",
  "homeroom",
  "parentEmail",
  "parentPhone",
  "photo",
  "photoUrl",
  "allergies",
  "dietaryRestrictions",
]

const AUTO_MAP_ALIASES: Record<FieldKey, string[]> = {
  id: ["id", "studentid", "student_id", "externalid"],
  mdId: ["mdid", "md_id", "madonnaid", "badgenumber", "badge_number", "studentnumber"],
  firstName: ["firstname", "first_name", "first"],
  lastName: ["lastname", "last_name", "last"],
  grade: ["grade", "gradelevel"],
  homeroom: ["homeroom", "home_room", "room"],
  balance: ["balance", "accountbalance"],
  parentEmail: ["parentemail", "parent_email", "email"],
  parentPhone: ["parentphone", "parent_phone", "phone"],
  photo: ["photo", "photofilename", "photo_filename"],
  photoUrl: ["photourl", "photo_url", "imageurl", "image_url"],
  allergies: ["allergies", "allergy"],
  dietaryRestrictions: ["dietaryrestrictions", "dietary", "diet"],
}

function autoDetectColumn(cols: string[], field: FieldKey): string | undefined {
  return cols.find((h) => {
    const normalized = h.toLowerCase().replace(/[_\s-]/g, "")
    return AUTO_MAP_ALIASES[field].some(
      (alias) => normalized === alias || normalized.includes(alias)
    )
  })
}

function parseAllergies(raw?: string) {
  if (!raw?.trim()) return []
  return raw.split(/[,;]/).map((a) => ({
    name: a.trim(),
    severity: "moderate" as const,
  }))
}

export function CsvImportWizard() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { students, addImportLog, rollbackImport, importLogs, databaseEnabled } = useDemo()
  const [importReport, setImportReport] = useState<{
    matched: number
    created: number
    updated: number
    skipped: number
    errors: Array<{ row: number; message: string }>
    rowOutcomes?: Array<{
      row: number
      mdId: string
      status: string
      message?: string
    }>
  } | null>(null)
  const [step, setStep] = useState<ImportStep>("upload")
  const [filename, setFilename] = useState("")
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({})
  const [validRows, setValidRows] = useState<Student[]>([])
  const [errorRows, setErrorRows] = useState<{ row: number; errors: string[] }[]>([])
  const [duplicateRows, setDuplicateRows] = useState<number[]>([])
  const [lastImportId, setLastImportId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const existingIds = useMemo(() => new Set(students.map((s) => s.id)), [students])

  const processFile = useCallback((file: File) => {
    setFilename(file.name)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? []
        setHeaders(cols)
        setRawRows(results.data)
        const autoMap: Partial<Record<FieldKey, string>> = {}
        for (const field of [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]) {
          const match = autoDetectColumn(cols, field)
          if (match) autoMap[field] = match
        }
        setMapping(autoMap)
        setStep("mapping")
      },
    })
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function runValidation() {
    const parsed: Student[] = []
    const errors: { row: number; errors: string[] }[] = []
    const duplicates: number[] = []

    rawRows.forEach((row, index) => {
      const mapped: Record<string, string> = {}
      for (const [field, col] of Object.entries(mapping)) {
        if (col) mapped[field] = row[col] ?? ""
      }

      const result = studentSchema.safeParse(mapped)
      if (!result.success) {
        errors.push({
          row: index + 2,
          errors: result.error.issues.map((i) => i.message),
        })
        return
      }

      const studentId = result.data.id || result.data.mdId!
      if (existingIds.has(studentId)) {
        duplicates.push(index + 2)
        errors.push({ row: index + 2, errors: ["Duplicate student ID"] })
        return
      }

      const parentContacts: ParentContact[] = []
      if (result.data.parentEmail) {
        parentContacts.push({
          name: `${result.data.firstName} ${result.data.lastName} Parent`,
          email: result.data.parentEmail,
          phone: result.data.parentPhone ?? "",
          relationship: "Guardian",
        })
      }

      parsed.push({
        id: studentId,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        grade: result.data.grade,
        homeroom: result.data.homeroom,
        balance: result.data.balance,
        photo:
          result.data.photoUrl ||
          result.data.photo ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop",
        allergies: parseAllergies(result.data.allergies),
        dietaryRestrictions: result.data.dietaryRestrictions
          ? result.data.dietaryRestrictions.split(/[,;]/).map((d) => d.trim()).filter(Boolean)
          : [],
        parentContacts,
      })
    })

    setValidRows(parsed)
    setErrorRows(errors)
    setDuplicateRows(duplicates)
    setStep(errors.length > 0 && parsed.length === 0 ? "validation" : "preview")
  }

  async function executeImport() {
    if (!user?.id) return
    const rows = validRows.map((student) => ({
      mdId: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      homeroom: student.homeroom ?? "",
      balance: student.balance,
      photoUrl: student.photo,
      parentEmail: student.parentContacts[0]?.email ?? "",
      parentPhone: student.parentContacts[0]?.phone ?? "",
      allergies: student.allergies.map((a) => a.name).join(", "),
      dietaryRestrictions: student.dietaryRestrictions.join(", "),
    }))

    const report = await api.adminImportStudents({
      adminUserId: user.id,
      performedBy: user.username ?? user.id,
      rows,
      updateExisting: true,
    })
    setImportReport(report)
    void queryClient.invalidateQueries({ queryKey: ["students"] })

    const log: ImportLog = {
      id: `imp-${Date.now()}`,
      filename,
      importedAt: new Date().toISOString(),
      totalRows: rawRows.length,
      successRows: report.created + report.updated,
      errorRows: report.errors.length,
      status: "completed",
      importedStudentIds: validRows.map((r) => r.id),
    }
    addImportLog(log)
    setLastImportId(log.id)
    setStep("complete")
  }

  function exportReconciliationCsv() {
    if (!importReport) return
    const rows =
      importReport.rowOutcomes?.map((row) => ({
        row: String(row.row),
        mdId: row.mdId,
        status: row.status,
        message: row.message ?? "",
      })) ??
      importReport.errors.map((err) => ({
        row: String(err.row),
        mdId: "",
        status: "error",
        message: err.message,
      }))

    exportRowsToCsv(
      "students",
      [
        { metric: "matched", value: String(importReport.matched) },
        { metric: "created", value: String(importReport.created) },
        { metric: "updated", value: String(importReport.updated) },
        { metric: "skipped", value: String(importReport.skipped) },
        { metric: "errors", value: String(importReport.errors.length) },
        ...rows,
      ],
      "sis-import-reconciliation"
    )
  }

  function handleRollback() {
    if (lastImportId) rollbackImport(lastImportId)
    setStep("upload")
    setValidRows([])
    setErrorRows([])
    setDuplicateRows([])
  }

  const steps: ImportStep[] = ["upload", "mapping", "validation", "preview", "complete"]
  const stepIndex = steps.indexOf(step)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              SIS CSV Import
            </CardTitle>
            <CardDescription>
              Upload → Field Mapping → Validation → Preview → Import → Rollback → Sync Logs
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadImportTemplate("students")}>
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
      </CardHeader>

      <div className="mb-6 flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-silver/40"}`}
          />
        ))}
      </div>

      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-12 transition ${
            dragOver ? "border-primary bg-primary/5" : "border-silver/80"
          }`}
        >
          <Upload className="h-10 w-10 text-silver-foreground" />
          <p className="mt-4 font-medium text-primary">Drag & drop SIS export CSV here</p>
          <p className="mt-1 text-sm text-silver-foreground">
            Supports: mdId, firstName, lastName, grade, homeroom, balance, photoUrl, parentEmail, parentPhone, allergies
          </p>
          <input
            type="file"
            accept=".csv"
            className="mt-4 text-sm"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </div>
      )}

      {step === "mapping" && (
        <div className="space-y-4">
          <p className="text-sm text-silver-foreground">
            Map CSV columns to student fields ({rawRows.length} rows detected)
          </p>
          {([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as FieldKey[]).map((field) => (
            <div key={field}>
              <Label>
                {field}
                {REQUIRED_FIELDS.includes(field) && <span className="text-danger"> *</span>}
              </Label>
              <Select
                value={mapping[field] ?? ""}
                onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
              >
                <option value="">— Select column —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Select>
            </div>
          ))}
          <Button onClick={runValidation}>Validate Data</Button>
        </div>
      )}

      {(step === "validation" || step === "preview") && (
        <div className="space-y-4">
          {duplicateRows.length > 0 && (
            <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4 text-sm text-warning">
              {duplicateRows.length} duplicate ID(s) detected — existing students will not be overwritten.
            </div>
          )}
          {errorRows.length > 0 && (
            <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4">
              <div className="flex items-center gap-2 font-semibold text-danger">
                <AlertCircle className="h-5 w-5" />
                {errorRows.length} error row(s)
              </div>
              <ul className="mt-2 max-h-32 overflow-y-auto text-sm text-danger">
                {errorRows.slice(0, 10).map((e) => (
                  <li key={e.row}>Row {e.row}: {e.errors.join(", ")}</li>
                ))}
              </ul>
            </div>
          )}
          {validRows.length > 0 && (
            <div className="rounded-2xl border border-success/40 bg-success/5 p-4">
              <div className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="h-5 w-5" />
                {validRows.length} valid row(s) ready to import
              </div>
              <div className="mt-3 max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-silver-foreground">
                      <th className="pb-2 text-left">ID</th>
                      <th className="pb-2 text-left">Name</th>
                      <th className="pb-2 text-left">Grade</th>
                      <th className="pb-2 text-left">Homeroom</th>
                      <th className="pb-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 10).map((r) => (
                      <tr key={r.id} className="border-t border-silver/30">
                        <td className="py-2">{r.id}</td>
                        <td className="py-2">{r.firstName} {r.lastName}</td>
                        <td className="py-2">{r.grade}</td>
                        <td className="py-2">{r.homeroom ?? "—"}</td>
                        <td className="py-2 text-right">${r.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {validRows.length > 0 && (
            <Button onClick={executeImport}>Import {validRows.length} Students</Button>
          )}
        </div>
      )}

      {step === "complete" && (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <p className="text-lg font-semibold text-primary">Import Complete</p>
          <p className="text-silver-foreground">
            {importReport
              ? `Matched ${importReport.matched}, created ${importReport.created}, updated ${importReport.updated}, skipped ${importReport.skipped}.`
              : `${validRows.length} students imported from ${filename}`}
          </p>
          {importReport && importReport.errors.length > 0 && (
            <ul className="mx-auto max-w-md text-left text-sm text-warning">
              {importReport.errors.slice(0, 8).map((err) => (
                <li key={`${err.row}-${err.message}`}>
                  Row {err.row}: {err.message}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-center gap-3">
            {importReport && (
              <Button variant="outline" onClick={exportReconciliationCsv}>
                <Download className="h-4 w-4" />
                Export Reconciliation CSV
              </Button>
            )}
            <Button variant="outline" onClick={handleRollback}>
              <RotateCcw className="h-4 w-4" />
              Rollback Import
            </Button>
            <Button onClick={() => setStep("upload")}>Import Another File</Button>
          </div>
        </div>
      )}

      {importLogs.length > 0 && (
        <div className="mt-8 border-t border-silver/60 pt-6">
          <h3 className="mb-4 font-semibold text-primary">Import History & Sync Logs</h3>
          <div className="space-y-2">
            {importLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-2xl border border-silver/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-primary">{log.filename}</p>
                  <p className="text-silver-foreground">
                    {new Date(log.importedAt).toLocaleString()} · {log.successRows}/{log.totalRows} imported
                    {log.errorRows > 0 && ` · ${log.errorRows} errors`}
                  </p>
                </div>
                <Badge variant={log.status === "completed" ? "success" : log.status === "rolled_back" ? "warning" : "danger"}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
