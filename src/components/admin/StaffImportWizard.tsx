"use client"

import { useCallback, useState } from "react"
import Papa from "papaparse"
import { z } from "zod"
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  FileUp,
  Upload,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api/client"
import { downloadImportTemplate, exportRowsToCsv } from "@/lib/import-export"
import { asTrimmedString, assertCsvFile } from "@/lib/import-export/coerce"
import { PRIMARY_ADMIN_EMAIL, PRIMARY_ADMIN_USERNAME, ROLE_LABELS } from "@/lib/users"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"

const staffRowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["admin", "cashier", "staff", "teacher"], {
    message: "Role must be admin, cashier, staff, or teacher",
  }),
  department: z.string().optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  badgeId: z.string().optional(),
  password: z.string().optional(),
})

type ImportStep = "upload" | "mapping" | "validation" | "preview" | "complete"
type FieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "role"
  | "department"
  | "username"
  | "phone"
  | "badgeId"
  | "password"

const REQUIRED_FIELDS: FieldKey[] = ["firstName", "lastName", "email", "role"]
const OPTIONAL_FIELDS: FieldKey[] = ["department", "username", "phone", "badgeId", "password"]

const ROLE_ALIASES: Record<string, z.infer<typeof staffRowSchema>["role"]> = {
  admin: "admin",
  administrator: "admin",
  cashier: "cashier",
  staff: "staff",
  teacher: "teacher",
  faculty: "teacher",
}

const AUTO_MAP_ALIASES: Record<FieldKey, string[]> = {
  firstName: ["firstname", "first_name", "first"],
  lastName: ["lastname", "last_name", "last"],
  email: ["email", "staffemail", "staff_email", "workemail"],
  role: ["role", "userrole", "user_role", "accountrole"],
  department: ["department", "dept", "division"],
  username: ["username", "login", "userid", "user_id"],
  phone: ["phone", "phonenumber", "phone_number", "mobile"],
  badgeId: ["badgeid", "badge_id", "badgenumber", "badge_number"],
  password: ["password", "temppassword", "temp_password"],
}

type ParsedStaffRow = z.infer<typeof staffRowSchema>

interface ImportResult {
  created: number
  skipped: number
  errors: Array<{ row: number; message: string }>
  credentials: Array<{
    email: string
    username: string
    role: string
    department?: string
    tempPassword?: string
    created: boolean
  }>
}

function autoDetectColumn(cols: string[], field: FieldKey): string | undefined {
  return cols.find((header) => {
    const normalized = header.toLowerCase().replace(/[_\s-]/g, "")
    return AUTO_MAP_ALIASES[field].some(
      (alias) => normalized === alias || normalized.includes(alias)
    )
  })
}

function normalizeRole(value: string): z.infer<typeof staffRowSchema>["role"] | null {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "")
  return ROLE_ALIASES[normalized] ?? null
}

function defaultUsername(email: string, override?: string): string {
  const trimmed = override?.trim()
  if (trimmed) return trimmed.toLowerCase()
  const local = email.split("@")[0] ?? "staff"
  return local.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "staff"
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard may be unavailable
  }
}

export function StaffImportWizard() {
  const { user: authUser } = useAuth()
  const { users, databaseEnabled } = useDemo()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<ImportStep>("upload")
  const [filename, setFilename] = useState("")
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({})
  const [validRows, setValidRows] = useState<ParsedStaffRow[]>([])
  const [errorRows, setErrorRows] = useState<{ row: number; errors: string[] }[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [bulkDefaultPassword, setBulkDefaultPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const trimmedDefaultPassword = bulkDefaultPassword.trim()
  const defaultPasswordReady = trimmedDefaultPassword.length >= 8
  const rowsNeedingDefaultPassword = validRows.filter((row) => !row.password?.trim()).length

  const processFile = useCallback((file: File) => {
    const csvError = assertCsvFile(file)
    if (csvError) {
      setFilename(file.name)
      setFormError(csvError)
      setErrorRows([])
      setStep("validation")
      return
    }
    setFilename(file.name)
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields ?? []
        setHeaders(cols)
        setRawRows(
          results.data.map((row) => {
            const mapped: Record<string, string> = {}
            for (const [key, value] of Object.entries(row)) {
              mapped[key] = asTrimmedString(value)
            }
            return mapped
          })
        )
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

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function runValidation() {
    const parsed: ParsedStaffRow[] = []
    const errors: { row: number; errors: string[] }[] = []
    setFormError(null)

    rawRows.forEach((row, index) => {
      const mapped: Record<string, string> = {}
      for (const [field, column] of Object.entries(mapping)) {
        if (column) mapped[field] = row[column] ?? ""
      }

      // Empty password cells are "missing" — use default bulk password on import.
      if (mapped.password !== undefined && !mapped.password.trim()) {
        delete mapped.password
      }

      const roleValue = mapped.role?.trim()
      if (roleValue) {
        const normalizedRole = normalizeRole(roleValue)
        if (!normalizedRole) {
          errors.push({
            row: index + 2,
            errors: ["Role must be admin, cashier, staff, or teacher"],
          })
          return
        }
        mapped.role = normalizedRole
      }

      const result = staffRowSchema.safeParse(mapped)
      if (!result.success) {
        errors.push({
          row: index + 2,
          errors: result.error.issues.map((issue) => issue.message),
        })
        return
      }

      const data = result.data
      const normalizedEmail = data.email.trim().toLowerCase()
      const derivedUsername = defaultUsername(normalizedEmail, data.username)

      if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
        errors.push({
          row: index + 2,
          errors: [`Email ${PRIMARY_ADMIN_EMAIL} is reserved for the IT administrator account`],
        })
        return
      }

      if (derivedUsername === PRIMARY_ADMIN_USERNAME) {
        errors.push({
          row: index + 2,
          errors: [`Username ${PRIMARY_ADMIN_USERNAME} is reserved for the IT administrator account`],
        })
        return
      }

      const existingUser = users.find((entry) => entry.email.toLowerCase() === normalizedEmail)
      if (existingUser) {
        errors.push({
          row: index + 2,
          errors: [`Email already registered as ${ROLE_LABELS[existingUser.role]}`],
        })
        return
      }

      parsed.push({
        ...data,
        password: data.password?.trim() || undefined,
      })
    })

    setValidRows(parsed)
    setErrorRows(errors)
    setStep(errors.length > 0 && parsed.length === 0 ? "validation" : "preview")
  }

  async function executeImport() {
    setImporting(true)
    setFormError(null)
    try {
      if (!databaseEnabled) {
        setFormError("Database is not configured. Set DATABASE_URL to import staff accounts.")
        setStep("validation")
        return
      }
      if (!authUser?.id) {
        setFormError("Admin session required for import")
        setStep("validation")
        return
      }

      const missingPasswordCount = validRows.filter((row) => !row.password?.trim()).length
      if (missingPasswordCount > 0 && !defaultPasswordReady) {
        setFormError(
          missingPasswordCount === validRows.length
            ? "Enter a default bulk password (at least 8 characters). It will be applied to every imported account that has no password in the CSV."
            : `Enter a default bulk password (at least 8 characters). ${missingPasswordCount} row(s) have no password in the CSV.`
        )
        setStep("preview")
        return
      }

      const result = await api.adminImportStaff({
        adminUserId: authUser.id,
        performedBy: authUser.username,
        defaultPassword: defaultPasswordReady ? trimmedDefaultPassword : undefined,
        rows: validRows,
      })
      setImportResult(result)
      setStep("complete")
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Import failed")
      setStep("validation")
    } finally {
      setImporting(false)
    }
  }

  function exportResultsCsv() {
    if (!importResult?.credentials.length) return
    exportRowsToCsv(
      "staff",
      importResult.credentials.map((cred) => ({
        email: cred.email,
        username: cred.username,
        role: cred.role,
        department: cred.department ?? "",
        password: cred.tempPassword ?? "",
        status: cred.created ? "created" : "skipped",
      })),
      "staff-import-results"
    )
  }

  function resetWizard() {
    setStep("upload")
    setFilename("")
    setRawRows([])
    setHeaders([])
    setMapping({})
    setValidRows([])
    setErrorRows([])
    setImportResult(null)
    setBulkDefaultPassword("")
    setFormError(null)
  }

  const steps: ImportStep[] = ["upload", "mapping", "validation", "preview", "complete"]
  const stepIndex = steps.indexOf(step)

  function renderDefaultPasswordField(inputId: string) {
    return (
      <div className="rounded-2xl border border-silver/60 bg-silver/10 p-4">
        <Label htmlFor={inputId}>Default bulk password</Label>
        <Input
          id={inputId}
          type="password"
          autoComplete="new-password"
          value={bulkDefaultPassword}
          onChange={(event) => {
            setBulkDefaultPassword(event.target.value)
            if (formError) setFormError(null)
          }}
          placeholder="At least 8 characters (e.g. school shared temp password)"
          minLength={8}
          className="mt-2"
        />
        <p className="mt-2 text-xs text-silver-foreground">
          Applied to every imported account whose CSV row has no password. Letters, numbers, and
          punctuation are allowed. Users must change this password on first login.
        </p>
        {bulkDefaultPassword.length > 0 && !defaultPasswordReady && (
          <p className="mt-2 text-xs text-danger">
            Password must be at least 8 characters ({trimmedDefaultPassword.length}/8).
          </p>
        )}
        {defaultPasswordReady && (
          <p className="mt-2 text-xs text-success">Default password ready ({trimmedDefaultPassword.length} characters).</p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Bulk Staff Import
            </CardTitle>
            <CardDescription>
              Create staff, teacher, cashier, and admin accounts from CSV
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadImportTemplate("staff")}>
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
      </CardHeader>

      <div className="mb-6 flex gap-2 px-6">
        {steps.map((currentStep, index) => (
          <div
            key={currentStep}
            className={`h-2 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-silver/40"}`}
          />
        ))}
      </div>

      <div className="px-6 pb-6">
        {step === "upload" && (
          <div className="space-y-6">
            {renderDefaultPasswordField("staff-bulk-default-password")}
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-8 transition sm:p-12 ${
                dragOver ? "border-primary bg-primary/5" : "border-silver/80"
              }`}
            >
              <Upload className="h-10 w-10 text-silver-foreground" />
              <p className="mt-4 font-medium text-primary">Drag &amp; drop staff import CSV here</p>
              <p className="mt-1 max-w-xl text-center text-sm text-silver-foreground">
                Required: firstName, lastName, email, role. Optional: department, username, phone,
                badgeId, password. Set the default bulk password above if your CSV has no password
                column.
              </p>
              <input
                type="file"
                accept=".csv"
                className="mt-4 text-sm"
                onChange={(event) => event.target.files?.[0] && processFile(event.target.files[0])}
              />
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            {renderDefaultPasswordField("staff-bulk-default-password-mapping")}
            <p className="text-sm text-silver-foreground">
              Map CSV columns to import fields ({rawRows.length} rows detected from {filename})
            </p>
            {([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as FieldKey[]).map((field) => (
              <div key={field}>
                <Label>
                  {field}
                  {REQUIRED_FIELDS.includes(field) && <span className="text-danger"> *</span>}
                </Label>
                <Select
                  value={mapping[field] ?? ""}
                  onChange={(event) =>
                    setMapping((current) => ({ ...current, [field]: event.target.value }))
                  }
                >
                  <option value="">— Select column —</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
            <Button onClick={runValidation}>Validate Data</Button>
          </div>
        )}

        {(step === "validation" || step === "preview") && (
          <div className="space-y-4">
            {formError && (
              <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4">
                <div className="flex items-center gap-2 font-semibold text-danger">
                  <AlertCircle className="h-5 w-5" />
                  Import blocked
                </div>
                <p className="mt-2 text-sm text-danger">{formError}</p>
              </div>
            )}
            {errorRows.length > 0 && (
              <div className="rounded-2xl border border-danger/40 bg-danger/5 p-4">
                <div className="flex items-center gap-2 font-semibold text-danger">
                  <AlertCircle className="h-5 w-5" />
                  {errorRows.length} error row(s)
                </div>
                <ul className="mt-2 max-h-32 overflow-y-auto text-sm text-danger">
                  {errorRows.slice(0, 10).map((entry) => (
                    <li key={entry.row}>
                      Row {entry.row}: {entry.errors.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {validRows.length > 0 && (
              <>
                {rowsNeedingDefaultPassword > 0 &&
                  renderDefaultPasswordField("staff-bulk-default-password-preview")}
                <div className="rounded-2xl border border-success/40 bg-success/5 p-4">
                  <div className="flex items-center gap-2 font-semibold text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    {validRows.length} valid row(s) ready to import
                  </div>
                  {rowsNeedingDefaultPassword > 0 && (
                    <p className="mt-2 text-sm text-silver-foreground">
                      {rowsNeedingDefaultPassword} row(s) will use the default bulk password
                      {defaultPasswordReady ? " (set above)." : " — enter it above before importing."}
                    </p>
                  )}
                  <div className="mt-3 max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-silver-foreground">
                          <th className="pb-2 text-left">Name</th>
                          <th className="pb-2 text-left">Email</th>
                          <th className="pb-2 text-left">Role</th>
                          <th className="pb-2 text-left">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.slice(0, 10).map((row, index) => (
                          <tr key={`${row.email}-${index}`} className="border-t border-silver/30">
                            <td className="py-2">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="py-2">{row.email}</td>
                            <td className="py-2">{ROLE_LABELS[row.role]}</td>
                            <td className="py-2">{row.department || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <Button
                  onClick={executeImport}
                  disabled={
                    importing || (rowsNeedingDefaultPassword > 0 && !defaultPasswordReady)
                  }
                >
                  {importing ? "Importing..." : `Import ${validRows.length} Row(s)`}
                </Button>
              </>
            )}
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <p className="mt-3 text-lg font-semibold text-primary">Import Complete</p>
              <p className="text-silver-foreground">
                {importResult.created} created · {importResult.skipped} skipped
              </p>
            </div>

            {importResult.errors.length > 0 && (
              <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4 text-sm">
                <p className="font-semibold text-warning">{importResult.errors.length} row error(s)</p>
                <ul className="mt-2 max-h-24 overflow-y-auto">
                  {importResult.errors.map((entry) => (
                    <li key={`${entry.row}-${entry.message}`}>
                      Row {entry.row}: {entry.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.credentials.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-silver/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-silver/60 bg-silver/10 text-silver-foreground">
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Username</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Temp Password</th>
                      <th className="px-4 py-3 text-right">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.credentials.map((cred) => (
                      <tr key={cred.email} className="border-b border-silver/30">
                        <td className="px-4 py-3">{cred.email}</td>
                        <td className="px-4 py-3 font-mono text-xs">{cred.username}</td>
                        <td className="px-4 py-3">
                          <Badge variant="default">{ROLE_LABELS[cred.role as keyof typeof ROLE_LABELS] ?? cred.role}</Badge>
                        </td>
                        <td className="px-4 py-3">{cred.department ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{cred.tempPassword ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {cred.tempPassword && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                void copyText(
                                  `Email: ${cred.email}\nUsername: ${cred.username}\nPassword: ${cred.tempPassword}`
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
              Imported staff appear in the <strong>Staff directory</strong> above. Tap{" "}
              <strong>Open profile</strong> on any row to edit details or add a photo.
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {importResult.credentials.length > 0 && (
                <Button variant="outline" onClick={exportResultsCsv}>
                  <Download className="h-4 w-4" />
                  Export Results CSV
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
              >
                View staff directory
              </Button>
              <Button onClick={resetWizard}>Import Another File</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
