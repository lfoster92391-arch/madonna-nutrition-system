"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { getPendingSubmission, getStudentProfile } from "@/data/demo"
import { useDemo } from "@/components/providers/DemoProvider"
import { DietaryFormStatusBadge } from "@/components/parent/DietaryFormStatusBadge"
import { AddFundsModal } from "@/components/parent/funding/AddFundsModal"
import { ParentEmptyState } from "@/components/parent/ParentEmptyState"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import type { Student } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

type StudentCardRowProps = {
  onAddFunds?: (studentId: string) => void
}

export function StudentCardRow({ onAddFunds }: StudentCardRowProps = {}) {
  const { studentProfiles, allergySubmissions } = useDemo()
  const { students: linkedStudents, isLoading } = useParentLinkedStudents()
  const [fundingStudent, setFundingStudent] = useState<Student | null>(null)

  if (!isLoading && linkedStudents.length === 0) {
    return <ParentEmptyState />
  }

  return (
    <>
      <section id="my-students">
        <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
          My Students
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {linkedStudents.map((student) => {
            const profile = getStudentProfile(student.id, studentProfiles)
            const pending = getPendingSubmission(student.id, allergySubmissions)

            return (
              <article key={student.id} className={cn(PARENT_CARD, "flex flex-col p-5 md:p-6")}>
                <div className="flex items-start gap-4">
                  <Image
                    src={student.photo}
                    alt={`${student.firstName} ${student.lastName}`}
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold md:text-lg" style={{ color: PARENT_NAVY }}>
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="mt-0.5 text-sm text-[#64748B]">Grade {student.grade}</p>
                    <p
                      className={cn(
                        "mt-2 text-xl font-bold tabular-nums md:text-2xl",
                        student.balance < 5 ? "text-danger" : "text-success"
                      )}
                    >
                      {formatCurrency(student.balance)}
                    </p>
                    <DietaryFormStatusBadge profile={profile} pendingSubmission={pending} />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 flex-1 rounded-[10px] border-[#C8CDD7] text-sm font-semibold"
                    style={{ color: PARENT_NAVY }}
                  >
                    <Link href={`/parent/student-profile/${student.id}`}>View Profile</Link>
                  </Button>
                  <Button
                    type="button"
                    className="h-10 flex-1 rounded-[10px] text-sm font-semibold"
                    style={{ backgroundColor: PARENT_NAVY }}
                    onClick={() =>
                      onAddFunds ? onAddFunds(student.id) : setFundingStudent(student)
                    }
                  >
                    Add Funds
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {!onAddFunds && fundingStudent && (
        <AddFundsModal
          open={!!fundingStudent}
          onOpenChange={(open) => {
            if (!open) setFundingStudent(null)
          }}
          studentId={fundingStudent.id}
          studentName={`${fundingStudent.firstName} ${fundingStudent.lastName}`}
          balance={fundingStudent.balance}
        />
      )}
    </>
  )
}
