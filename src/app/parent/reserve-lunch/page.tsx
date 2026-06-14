"use client"

import Link from "next/link"
import { ModuleShell } from "@/components/layout/ModuleShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { parentLinkedStudents } from "@/data/demo"
import { formatCurrency } from "@/lib/utils"

export default function ParentReserveLunchPage() {
  return (
    <ModuleShell section="Parent Portal" title="Reserve Lunch" description="Pre-order meals once the lunch agreement is signed.">
      <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
        <div className="grid gap-4 md:grid-cols-2">
          {parentLinkedStudents.map((student) => (
            <div key={student.id} className="rounded-2xl border border-[#AEB6C2]/60 px-5 py-4">
              <p className="font-semibold text-[#041B52]">{student.firstName} {student.lastName}</p>
              <p className="text-sm text-[#AEB6C2]">Balance: {formatCurrency(student.balance)}</p>
            </div>
          ))}
        </div>
        <Button asChild className="mt-6"><Link href="/parent/calendar">Open Meal Calendar</Link></Button>
      </Card>
    </ModuleShell>
  )
}
