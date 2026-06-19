"use client"

import Link from "next/link"
import { ModuleShell } from "@/components/layout/ModuleShell"
import { useAgreementStatus } from "@/components/agreements/useAgreementStatus"
import { formatStudentAgreementStatus } from "@/lib/agreements/student-status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ParentAgreementStatusPage() {
  const { students, requiresSignature, currentVersion, loading } = useAgreementStatus()

  return (
    <ModuleShell
      section="Parent Portal"
      title="Agreement Status"
      description="Track lunch agreement signatures per student."
    >
      {loading ? (
        <p className="text-[#AEB6C2]">Loading agreement status...</p>
      ) : (
        <div className="space-y-4">
          {currentVersion ? (
            <p className="text-sm text-[#64748B]">
              Current published version: <strong>{currentVersion.versionLabel}</strong>
            </p>
          ) : null}
          {students.map((student) => (
            <Card key={student.studentId} className="rounded-[20px] border-[#AEB6C2]/60 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-[#041B52]">{student.studentName}</p>
                <span
                  className={`rounded-full px-4 py-1 text-xs font-bold uppercase ${
                    student.status === "SIGNED" || student.status === "EXPIRING"
                      ? "bg-[#00A83E]/15 text-[#00A83E]"
                      : "bg-[#D62828]/10 text-[#D62828]"
                  }`}
                >
                  {formatStudentAgreementStatus(student.status)}
                </span>
              </div>
              {student.signedAt ? (
                <p className="mt-2 text-xs text-[#AEB6C2]">
                  Signed {new Date(student.signedAt).toLocaleString()}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
      {requiresSignature ? (
        <Button asChild className="mt-6">
          <Link href="/parent/agreements">Sign Cafeteria Agreement</Link>
        </Button>
      ) : null}
    </ModuleShell>
  )
}
