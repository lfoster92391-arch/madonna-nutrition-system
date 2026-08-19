"use client"

import { useMemo, useRef } from "react"
import { ArrowLeft, Printer } from "lucide-react"
import type { Student } from "@/lib/types"
import { StudentBadgeCard } from "@/components/admin/StudentBadgeCard"
import { Button } from "@/components/ui/button"

interface BadgeMassPrintProps {
  students: Student[]
  onClose: () => void
}

export function BadgeMassPrint({ students, onClose }: BadgeMassPrintProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const sorted = useMemo(
    () =>
      [...students].sort((a, b) => {
        const last = a.lastName.localeCompare(b.lastName)
        if (last !== 0) return last
        return a.firstName.localeCompare(b.firstName)
      }),
    [students]
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="badge-print-controls no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-silver/60 bg-white p-3 shadow-sm sm:p-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-primary sm:text-xl">Print student badges</h2>
          <p className="mt-1 text-sm text-silver-foreground">
            Preview below shows {sorted.length} badge{sorted.length === 1 ? "" : "s"} —{" "}
            landscape cards at 3&quot; × 2¾&quot;, two across on letter paper. Missing photo,
            email, grade, or barcode still print; check the card and fill gaps later if needed.
          </p>
          <p className="mt-2 text-xs font-medium text-primary/80">
            On phones, swipe sideways to pan the badge preview. Leave ½&quot; clear at the top for
            the badge hole. Content (Madonna logo, school name, photo, status, barcode) sits in the
            band from ½&quot; from the top — 3&quot; × 2¾&quot; landscape badges with top hole.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button variant="outline" className="min-h-11 flex-1 sm:flex-none" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to roster
          </Button>
          <Button
            size="lg"
            className="min-h-11 flex-1 sm:flex-none"
            onClick={handlePrint}
            disabled={sorted.length === 0}
          >
            <Printer className="mr-2 h-5 w-5" />
            Print now
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="no-print rounded-2xl border border-warning/40 bg-warning/5 p-4 text-sm text-primary">
          No students selected. Go back and choose students to print.
        </p>
      ) : (
        <div
          ref={printRef}
          className="badge-print-sheet mobile-scroll-x rounded-2xl border border-silver/40 bg-white p-3 shadow-sm sm:p-4 print:rounded-none print:border-0 print:p-0 print:shadow-none"
        >
          <div className="badge-print-grid mx-auto grid max-w-[8.5in] grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 print:max-w-none print:gap-3">
            {sorted.map((student) => (
              <StudentBadgeCard key={student.id} student={student} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
