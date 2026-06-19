"use client"

import { useRef, useState } from "react"
import { ChevronDown, Download, FileDown, FileUp } from "lucide-react"
import { downloadImportTemplate, exportRowsToCsv } from "@/lib/import-export"
import type { ImportExportType } from "@/lib/import-export"
import { Button } from "@/components/ui/button"

interface ImportExportMenuProps {
  type: ImportExportType
  /** Called when user chooses Import (e.g. scroll to wizard or open file picker) */
  onImport?: () => void
  /** Rows to export; if omitted, export downloads template with sample row only */
  exportRows?: Record<string, string>[]
  /** Hide import option (export + template only) */
  importDisabled?: boolean
  /** Compact variant for dashboard cards */
  variant?: "default" | "compact"
}

export function ImportExportMenu({
  type,
  onImport,
  exportRows,
  importDisabled = false,
  variant = "default",
}: ImportExportMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  function handleExport() {
    if (exportRows && exportRows.length > 0) {
      exportRowsToCsv(type, exportRows)
    } else {
      downloadImportTemplate(type)
    }
    setOpen(false)
  }

  function handleTemplate() {
    downloadImportTemplate(type)
    setOpen(false)
  }

  function handleImport() {
    onImport?.()
    setOpen(false)
  }

  if (variant === "compact") {
    return (
      <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.preventDefault()}>
        {!importDisabled && onImport && (
          <button
            type="button"
            onClick={handleImport}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:bg-[#0A1E3F]/5"
            style={{ borderColor: "#C8CDD7", color: "#0A1E3F" }}
          >
            <FileUp className="h-3 w-3" />
            Import
          </button>
        )}
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:bg-[#0A1E3F]/5"
          style={{ borderColor: "#C8CDD7", color: "#0A1E3F" }}
        >
          <FileDown className="h-3 w-3" />
          Export
        </button>
        <button
          type="button"
          onClick={handleTemplate}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:bg-[#0A1E3F]/5"
          style={{ borderColor: "#C8CDD7", color: "#0A1E3F" }}
        >
          <Download className="h-3 w-3" />
          Template
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-1.5"
      >
        Import / Export
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-silver/60 bg-white py-1 shadow-lg">
            {!importDisabled && onImport && (
              <button
                type="button"
                onClick={handleImport}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-primary hover:bg-silver/20"
              >
                <FileUp className="h-4 w-4" />
                Import
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-primary hover:bg-silver/20"
            >
              <FileDown className="h-4 w-4" />
              Export
            </button>
            <button
              type="button"
              onClick={handleTemplate}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-primary hover:bg-silver/20"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </div>
        </>
      )}
    </div>
  )
}
