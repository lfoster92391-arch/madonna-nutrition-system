"use client"

import { FileImage, FileText, Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExportDesignModalProps {
  open: boolean
  onClose: () => void
}

const EXPORT_OPTIONS = [
  {
    id: "pdf",
    label: "Export as PDF",
    description: "High-quality PDF for printing and sharing",
    icon: FileText,
  },
  {
    id: "png",
    label: "Export as PNG",
    description: "Image file for digital displays and social media",
    icon: FileImage,
  },
  {
    id: "print",
    label: "Print Calendar",
    description: "Send directly to your printer",
    icon: Printer,
  },
] as const

export function ExportDesignModal({ open, onClose }: ExportDesignModalProps) {
  if (!open) return null

  function handleExport(optionId: string) {
    if (optionId === "print") {
      window.print()
    } else {
      alert(`Export as ${optionId.toUpperCase()} — coming soon!`)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-silver bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">Export Design</h2>
            <p className="text-sm text-primary/60">Choose your export format</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-primary/60 transition hover:bg-silver/20 hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {EXPORT_OPTIONS.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleExport(id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl border border-silver/60 p-4 text-left transition",
                "hover:border-primary/30 hover:bg-primary/5"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">{label}</p>
                <p className="text-xs text-primary/60">{description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
