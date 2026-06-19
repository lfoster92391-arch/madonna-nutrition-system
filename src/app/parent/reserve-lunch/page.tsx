"use client"

import Link from "next/link"
import { ModuleShell } from "@/components/layout/ModuleShell"
import { useAgreementStatus } from "@/components/agreements/useAgreementStatus"
import { formatStudentAgreementStatus, isLunchSignupAllowed } from "@/lib/agreements/student-status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { parentLinkedStudents } from "@/data/demo"
import { formatCurrency } from "@/lib/utils"

export default function ParentReserveLunchPage() {
  const { students, requiresSignature, loading } = useAgreementStatus()

  const statusByStudent = new Map(students.map((s) => [s.studentId, s]))

  if (loading) {
    return (
      <ModuleShell section="Parent Portal" title="Reserve Lunch" description="Loading eligibility...">
        <p className="text-[#AEB6C2]">Checking cafeteria agreement status...</p>
      </ModuleShell>
    )
  }

  if (requiresSignature) {
    return (
      <ModuleShell
        section="Parent Portal"
        title="Reserve Lunch"
        description="A signed cafeteria agreement is required before lunch enrollment."
      >
        <Card className="rounded-[20px] border-[#D62828]/30 bg-[#D62828]/5 p-8">
          <p className="font-semibold text-[#041B52]">Cafeteria Agreement Required</p>
          <p className="mt-2 text-sm text-[#64748B]">
            You must sign the current Fuel The Dons cafeteria agreement before reserving meals.
          </p>
          <Button asChild className="mt-6">
            <Link href="/parent/agreements">Sign Agreement</Link>
          </Button>
        </Card>
      </ModuleShell>
    )
  }

  return (
    <ModuleShell
      section="Parent Portal"
      title="Reserve Lunch"
      description="Pre-order meals for students with a signed cafeteria agreement."
    >
      <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
        <div className="grid gap-4 md:grid-cols-2">
          {parentLinkedStudents.map((student) => {
            const agreement = statusByStudent.get(student.id)
            const eligible = agreement ? isLunchSignupAllowed(agreement.status) : false
            return (
              <div
                key={student.id}
                className="rounded-2xl border border-[#AEB6C2]/60 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#041B52]">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-[#AEB6C2]">
                      Balance: {formatCurrency(student.balance)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      eligible
                        ? "bg-[#00A83E]/15 text-[#00A83E]"
                        : "bg-[#D62828]/10 text-[#D62828]"
                    }`}
                  >
                    {agreement ? formatStudentAgreementStatus(agreement.status) : "Required"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        <Button asChild className="mt-6">
          <Link href="/parent/calendar">Open Meal Calendar</Link>
        </Button>
      </Card>
    </ModuleShell>
  )
}
