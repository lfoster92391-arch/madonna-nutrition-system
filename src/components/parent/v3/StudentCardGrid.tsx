"use client"

import { useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  getPendingSubmission,
  getStudentProfile,
  parentLinkedStudents,
} from "@/data/demo"
import { useDemo } from "@/components/providers/DemoProvider"
import { DietaryFormStatusBadge } from "@/components/parent/DietaryFormStatusBadge"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { V3_CARD, V3_CARD_BORDER, V3_NAVY } from "@/components/parent/v3/parent-v3-theme"
import { Button } from "@/components/ui/button"
import { formatCurrency, cn } from "@/lib/utils"
import { formatTransactionDate } from "@/lib/parent-transactions"

type StudentCardGridProps = {
  onAddFunds: (studentId: string) => void
}

export function StudentCardGrid({ onAddFunds }: StudentCardGridProps) {
  const router = useRouter()
  const { studentProfiles, allergySubmissions } = useDemo()
  const { mealTransactions } = useParentTransactions()

  const studentActivity = useMemo(() => {
    const map = new Map<
      string,
      { recentMeal?: string; recentDate?: string; updatedLabel: string }
    >()

    for (const student of parentLinkedStudents) {
      const profile = getStudentProfile(student.id, studentProfiles)
      const updatedLabel = profile?.allergyReviewedAt
        ? formatTransactionDate(profile.allergyReviewedAt)
        : "Not reviewed"

      const latestMeal = mealTransactions.find((tx) => tx.studentId === student.id)
      map.set(student.id, {
        recentMeal: latestMeal?.meal,
        recentDate: latestMeal ? formatTransactionDate(latestMeal.timestamp) : undefined,
        updatedLabel,
      })
    }
    return map
  }, [mealTransactions, studentProfiles])

  return (
    <section id="my-students">
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: V3_NAVY }}>
        My Students
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {parentLinkedStudents.map((student) => {
          const profile = getStudentProfile(student.id, studentProfiles)
          const pending = getPendingSubmission(student.id, allergySubmissions)
          const activity = studentActivity.get(student.id)

          return (
            <div key={student.id} className="flex h-full flex-col">
              <article
                className={cn(
                  V3_CARD,
                  V3_CARD_BORDER,
                  "flex h-[220px] cursor-pointer flex-col p-5 transition hover:border-[#041B52]/25"
                )}
                onClick={() => router.push(`/parent/student-profile/${student.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(`/parent/student-profile/${student.id}`)
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={`Open ${student.firstName} ${student.lastName} profile`}
              >
                <div className="relative flex min-h-0 flex-1 items-start gap-3">
                  <Image
                    src={student.photo}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1 pt-1">
                    <h3 className="truncate text-base font-bold" style={{ color: V3_NAVY }}>
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="mt-0.5 text-sm text-[#64748B]">Grade {student.grade}</p>
                    <div className="mt-2">
                      <DietaryFormStatusBadge
                        profile={profile}
                        pendingSubmission={pending}
                        variant="dot"
                      />
                    </div>
                  </div>
                  <span
                    className="pointer-events-none select-none text-4xl font-bold opacity-[0.06]"
                    style={{ color: V3_NAVY }}
                    aria-hidden
                  >
                    {student.grade}
                  </span>
                </div>

                <div
                  className="mt-auto flex items-center gap-3 border-t border-[#C7CCD6] pt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p
                    className={cn(
                      "min-w-[72px] text-lg font-bold tabular-nums",
                      student.balance < 5 ? "text-[#EA580C]" : "text-[#16A34A]"
                    )}
                  >
                    {formatCurrency(student.balance)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 flex-1 rounded-[12px] border-[#C7CCD6] text-sm font-semibold"
                    style={{ color: V3_NAVY }}
                    onClick={() => router.push(`/parent/student-profile/${student.id}`)}
                  >
                    Open Student
                  </Button>
                  <Button
                    type="button"
                    className="h-11 flex-1 rounded-[12px] text-sm font-semibold text-white"
                    style={{ backgroundColor: V3_NAVY }}
                    onClick={() => onAddFunds(student.id)}
                  >
                    Add Funds
                  </Button>
                </div>
              </article>

              <dl className="mt-3 grid gap-1 text-xs text-[#64748B]">
                <div className="flex justify-between gap-2">
                  <dt>Today&apos;s Lunch</dt>
                  <dd className="font-medium text-[#041B52]">
                    {activity?.recentMeal?.toLowerCase().includes("lunch")
                      ? activity.recentMeal
                      : "Menu posted"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Recent Purchase</dt>
                  <dd className="font-medium text-[#041B52]">
                    {activity?.recentMeal
                      ? `${activity.recentMeal} · ${activity.recentDate}`
                      : "None yet"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Updated</dt>
                  <dd className="font-medium text-[#041B52]">{activity?.updatedLabel}</dd>
                </div>
              </dl>
            </div>
          )
        })}
      </div>
    </section>
  )
}
