"use client"

import { useCallback, useMemo, useState } from "react"
import Papa from "papaparse"
import { z } from "zod"
import { FileUp, Upload } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { downloadImportTemplate } from "@/lib/import-export"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const rowSchema = z.object({
  parentEmail: z.string().email(),
  parentName: z.string().min(1),
  parentPhone: z.string().optional(),
  mdId: z.string().min(1),
  relationship: z.string().optional(),
})

export function ParentImportWizard() {
  const { user } = useAuth()
  const [filename, setFilename] = useState("")
  const [rows, setRows] = useState<z.infer<typeof rowSchema>[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ linked: number; errors: { row: number; message: string }[] } | null>(
    null
  )

  const validCount = useMemo(() => rows.length, [rows])

  const handleFile = useCallback((file: File) => {
    setFilename(file.name)
    setResult(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const nextRows: z.infer<typeof rowSchema>[] = []
        const nextErrors: string[] = []
        parsed.data.forEach((raw, index) => {
          const normalized = {
            parentEmail: raw.parentEmail ?? raw["Parent Email"] ?? "",
            parentName: raw.parentName ?? raw["Parent Name"] ?? "",
            parentPhone: raw.parentPhone ?? raw.Phone ?? "",
            mdId: raw.mdId ?? raw["Student MD ID"] ?? raw["MD ID"] ?? "",
            relationship: raw.relationship ?? raw.Relationship ?? "",
          }
          const check = rowSchema.safeParse(normalized)
          if (check.success) {
            nextRows.push(check.data)
          } else {
            nextErrors.push(`Row ${index + 2}: invalid data`)
          }
        })
        setRows(nextRows)
        setErrors(nextErrors)
      },
    })
  }, [])

  async function handleImport() {
    if (!user || rows.length === 0) return
    setImporting(true)
    try {
      const res = await fetch("/api/imports/parents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-user-id": user.id,
        },
        body: JSON.stringify({ adminUserId: user.id, rows }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ linked: data.linked ?? 0, errors: data.errors ?? [] })
      } else {
        setErrors([data.error ?? "Import failed"])
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parent Contact Import</CardTitle>
        <CardDescription>
          Upload the parent CSV template to create Parent records and link students.
        </CardDescription>
      </CardHeader>
      <div className="space-y-4 px-6 pb-6">
        <Button type="button" variant="outline" onClick={() => downloadImportTemplate("parents")}>
          Download Template
        </Button>

        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-silver/60 px-6 py-10 text-center">
          <FileUp className="h-8 w-8 text-silver-foreground" />
          <span className="text-sm text-silver-foreground">
            {filename || "Drop parent CSV or click to browse"}
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </label>

        {validCount > 0 ? (
          <p className="text-sm text-silver-foreground">{validCount} valid rows ready to import.</p>
        ) : null}

        {errors.length > 0 ? (
          <ul className="text-sm text-destructive">
            {errors.slice(0, 5).map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : null}

        <Button type="button" disabled={importing || validCount === 0} onClick={() => void handleImport()}>
          <Upload className="mr-2 h-4 w-4" />
          {importing ? "Importing..." : "Import Parents"}
        </Button>

        {result ? (
          <p className="text-sm text-success">
            Linked {result.linked} parent-student records.
            {result.errors.length > 0 ? ` ${result.errors.length} row(s) skipped.` : ""}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
