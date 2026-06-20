"use client"

import { useCallback, useMemo, useState } from "react"
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
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api/client"
import { downloadImportTemplate, exportRowsToCsv } from "@/lib/import-export"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label, Select } from "@/components/ui/input"

const familyRowSchema = z.object({
  parentEmail: z.string().email(),
  parentFirstName: z.string().min(1),
  parentLastName: z.string().min(1),
  parentPhone: z.string().optional(),
  parentUsername: z.string().optional(),
  studentMdId: z.string().min(1),
  studentFirstName: z.string().optional(),
  studentLastName: z.string().optional(),
  grade: z.string().optional(),
  balance: z.coerce.number().optional(),
  relationship: z.string().optional(),
  password: z.string().optional(),
  sendWelcomeEmail: z.string().optional(),
})

type ImportStep = "upload" | "mapping" | "validation" | "preview" | "complete"
type FieldKey =
  | "parentEmail"
  | "parentFirstName"
  | "parentLastName"
  | "parentPhone"
  | "parentUsername"
  | "studentMdId"
  | "studentFirstName"
  | "studentLastName"
  | "grade"
  | "balance"
  | "relationship"
  | "password"
  | "sendWelcomeEmail"

const REQUIRED_FIELDS: FieldKey[] = ["parentEmail", "parentFirstName", "parentLastName", "studentMdId"]
const OPTIONAL_FIELDS: FieldKey[] = [
  "parentPhone",
  "parentUsername",
  "studentFirstName",
  "studentLastName",
  "grade",
  "balance",
  "relationship",
  "password",
  "sendWelcomeEmail",
]

const AUTO_MAP_ALIASES: Record<FieldKey, string[]> = {
  parentEmail: ["parentemail", "parent_email", "email"],
  parentFirstName: ["parentfirstname", "parent_first_name", "parentfirst"],
  parentLastName: ["parentlastname", "parent_last_name", "parentlast"],
  parentPhone: ["parentphone", "parent_phone", "phone"],
  parentUsername: ["parentusername", "parent_username", "username"],
  studentMdId: ["studentmdid", "student_md_id", "mdid", "md_id", "studentid", "student_id"],
  studentFirstName: ["studentfirstname", "student_first_name", "studentfirst"],
  studentLastName: ["studentlastname", "student_last_name", "studentlast"],
  grade: ["grade", "gradelevel"],
  balance: ["balance", "accountbalance"],
  relationship: ["relationship", "relation"],
  password: ["password", "temppassword", "temp_password"],
  sendWelcomeEmail: ["sendwelcomeemail", "send_welcome_email", "welcomeemail"],
}

type ParsedFamilyRow = z.infer<typeof familyRowSchema>

interface ImportResult {
  created: number
  linked: number
  skipped: number
  errors: Array<{ row: number; message: string }>
  credentials: Array<{
    email: string
    username: string
    tempPassword?: string
    studentMdIds: string[]
    created: boolean
    linked: boolean
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

function defaultUsername(email: string, override?: string): string {
  const trimmed = override?.trim()
  if (trimmed) return trimmed.toLowerCase()
  const local = email.split("@")[0] ?? "parent"
  return local.toLowerCase().replace(/[^a-z0-9._-]/g, "") || "parent"
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Clipboard may be unavailable
  }
}

export function FamilyImportWizard() {
  const { user: authUser } = useAuth()
  const {
    students,
    users,
    databaseEnabled,
  } = useDemo()

  const [step, setStep] = useState<ImportStep>("upload")
  const [filename, setFilename] = useState("")
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({})
  const [validRows, setValidRows] = useState<ParsedFamilyRow[]>([])
  const [errorRows, setErrorRows] = useState<{ row: number; errors: string[] }[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const existingStudentIds = useMemo(() => new Set(students.map((student) => student.id)), [students])

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

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function runValidation() {
    const parsed: ParsedFamilyRow[] = []
    const errors: { row: number; errors: string[] }[] = []

    rawRows.forEach((row, index) => {
      const mapped: Record<string, string> = {}
      for (const [field, column] of Object.entries(mapping)) {
        if (column) mapped[field] = row[column] ?? ""
      }

      const result = familyRowSchema.safeParse(mapped)
      if (!result.success) {
        errors.push({
          row: index + 2,
          errors: result.error.issues.map((issue) => issue.message),
        })
        return
      }

      const data = result.data
      if (!existingStudentIds.has(data.studentMdId.trim())) {
        const missing: string[] = []
        if (!data.studentFirstName?.trim()) missing.push("studentFirstName")
        if (!data.studentLastName?.trim()) missing.push("studentLastName")
        if (!data.grade?.trim()) missing.push("grade")
        if (data.balance === undefined || Number.isNaN(data.balance)) missing.push("balance")
        if (missing.length > 0) {
          errors.push({
            row: index + 2,
            errors: [`Student ${data.studentMdId} not found; provide ${missing.join(", ")} to create`],
          })
          return
        }
      }

      const existingUser = users.find((entry) => entry.email.toLowerCase() === data.parentEmail.toLowerCase())
      if (existingUser && existingUser.role !== "parent") {
        errors.push({
          row: index + 2,
          errors: [`Email already registered as ${existingUser.role}`],
        })
        return
      }

      parsed.push(data)
    })

    setValidRows(parsed)
    setErrorRows(errors)
    setStep(errors.length > 0 && parsed.length === 0 ? "validation" : "preview")
  }

  async function executeImport() {
    setImporting(true)
    try {
      if (!databaseEnabled) {
        setErrorRows([
          {
            row: 0,
            errors: ["Database is not configured. Set DATABASE_URL to import families."],
          },
        ])
        setStep("validation")
        return
      }
      if (!authUser?.id) {
        setErrorRows([{ row: 0, errors: ["Admin session required for import"] }])
        setStep("validation")
        return
      }
      const result = await api.adminImportFamilies({
        adminUserId: authUser.id,
        performedBy: authUser.username,
        rows: validRows,
      })
      setImportResult(result)
      setStep("complete")
    } catch (error) {
      setErrorRows([
        {
          row: 0,
          errors: [error instanceof Error ? error.message : "Import failed"],
        },
      ])
      setStep("validation")
    } finally {
      setImporting(false)
    }
  }

  function exportResultsCsv() {
    if (!importResult?.credentials.length) return
    exportRowsToCsv(
      "families",
      importResult.credentials.map((cred) => ({
        parentEmail: cred.email,
        parentUsername: cred.username,
        password: cred.tempPassword ?? "",
        studentMdIds: cred.studentMdIds.join("; "),
        status: cred.created ? "created" : "linked",
      })),
      "import-results"
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
              Bulk User &amp; Family Import
            </CardTitle>
            <CardDescription>
              Create parent accounts with passwords and link them to students by MD ID
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadImportTemplate("families")}>
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
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-12 transition ${
              dragOver ? "border-primary bg-primary/5" : "border-silver/80"
            }`}
          >
            <Upload className="h-10 w-10 text-silver-foreground" />
            <p className="mt-4 font-medium text-primary">Drag &amp; drop family import CSV here</p>
            <p className="mt-1 max-w-xl text-center text-sm text-silver-foreground">
              Required: parentEmail, parentFirstName, parentLastName, studentMdId. Include student
              fields when creating new students.
            </p>
            <input
              type="file"
              accept=".csv"
              className="mt-4 text-sm"
              onChange={(event) => event.target.files?.[0] && processFile(event.target.files[0])}
            />
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <p className="text-sm text-silver-foreground">
              Map CSV columns to import fields ({rawRows.length} rows detected)
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
              <div className="rounded-2xl border border-success/40 bg-success/5 p-4">
                <div className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  {validRows.length} valid row(s) ready to import
                </div>
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-silver-foreground">
                        <th className="pb-2 text-left">Parent</th>
                        <th className="pb-2 text-left">Email</th>
                        <th className="pb-2 text-left">Student MD ID</th>
                        <th className="pb-2 text-left">Relationship</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.slice(0, 10).map((row, index) => (
                        <tr key={`${row.parentEmail}-${row.studentMdId}-${index}`} className="border-t border-silver/30">
                          <td className="py-2">
                            {row.parentFirstName} {row.parentLastName}
                          </td>
                          <td className="py-2">{row.parentEmail}</td>
                          <td className="py-2 font-mono text-xs">{row.studentMdId}</td>
                          <td className="py-2">{row.relationship || "Guardian"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {validRows.length > 0 && (
              <Button onClick={executeImport} disabled={importing}>
                {importing ? "Importing..." : `Import ${validRows.length} Row(s)`}
              </Button>
            )}
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <p className="mt-3 text-lg font-semibold text-primary">Import Complete</p>
              <p className="text-silver-foreground">
                {importResult.created} created · {importResult.linked} linked · {importResult.skipped} skipped
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
                      <th className="px-4 py-3 text-left">Temp Password</th>
                      <th className="px-4 py-3 text-left">Students</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.credentials.map((cred) => (
                      <tr key={cred.email} className="border-b border-silver/30">
                        <td className="px-4 py-3">{cred.email}</td>
                        <td className="px-4 py-3 font-mono text-xs">{cred.username}</td>
                        <td className="px-4 py-3 font-mono text-xs">{cred.tempPassword ?? "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{cred.studentMdIds.join(", ")}</td>
                        <td className="px-4 py-3">
                          <Badge variant={cred.created ? "success" : "warning"}>
                            {cred.created ? "Created" : "Linked"}
                          </Badge>
                        </td>
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

            <div className="flex flex-wrap justify-center gap-3">
              {importResult.credentials.length > 0 && (
                <Button variant="outline" onClick={exportResultsCsv}>
                  <Download className="h-4 w-4" />
                  Export Results CSV
                </Button>
              )}
              <Button onClick={resetWizard}>Import Another File</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
