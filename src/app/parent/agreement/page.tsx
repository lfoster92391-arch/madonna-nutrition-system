"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ModuleShell } from "@/components/layout/ModuleShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LUNCH_AGREEMENT_STORAGE_KEY } from "@/config/onboarding-pricing"
import { parentLinkedStudents } from "@/data/demo"

export default function ParentAgreementStatusPage() {
  const [agreements, setAgreements] = useState<Array<{ studentId: string; status: string }>>([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LUNCH_AGREEMENT_STORAGE_KEY)
      setAgreements(raw ? JSON.parse(raw) : [])
    } catch {
      setAgreements([])
    }
  }, [])

  return (
    <ModuleShell section="Parent Portal" title="Agreement Status" description="Track lunch agreement signatures per student.">
      <div className="space-y-4">
        {parentLinkedStudents.map((student) => {
          const signed = agreements.some((a) => a.studentId === student.id && a.status === "signed")
          return (
            <Card key={student.id} className="rounded-[20px] border-[#AEB6C2]/60 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-[#041B52]">{student.firstName} {student.lastName}</p>
                <span className={`rounded-full px-4 py-1 text-xs font-bold uppercase ${signed ? "bg-[#00A83E]/15 text-[#00A83E]" : "bg-[#D62828]/10 text-[#D62828]"}`}>
                  {signed ? "Signed" : "Pending"}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
      <Button asChild className="mt-6"><Link href="/onboarding/lunch-agreement">Review Lunch Agreement</Link></Button>
    </ModuleShell>
  )
}
