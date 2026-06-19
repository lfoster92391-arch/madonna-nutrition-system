"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { History, User, Wallet } from "lucide-react"
import { AddFundsModal } from "@/components/parent/funding/AddFundsModal"
import {
  getPendingSubmission,
  getStudentProfile,
  parentRecentActivity,
  todaysMenuItems,
  type Student,
} from "@/data/demo"
import { useDemo } from "@/components/providers/DemoProvider"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { getFoodProfileDisplayLabel, getFoodProfileStatus, isDietaryFormBlocking } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

type StudentCenterCardProps = {
  student: Student
}

export function StudentCenterCard({ student }: StudentCenterCardProps) {
  const router = useRouter()
  const { studentProfiles, allergySubmissions } = useDemo()
  const [fundingOpen, setFundingOpen] = useState(false)
  const profile = getStudentProfile(student.id, studentProfiles)
  const pending = getPendingSubmission(student.id, allergySubmissions)
  const nutritionStatus = getFoodProfileStatus(profile, pending)
  const fullName = `${student.firstName} ${student.lastName}`
  const profileHref = `/parent/student-profile/${student.id}`

  const recentPurchase = parentRecentActivity.find((a) => a.student === fullName)
  const isLowBalance = student.balance < 5
  const mealStatus = isLowBalance ? "Needs Funds" : "Active"

  const badges: { label: string; className: string }[] = [
    { label: "✓ Active", className: "bg-success/10 text-success" },
  ]
  if (isDietaryFormBlocking(profile, pending)) {
    badges.push({
      label: `⚠ ${getFoodProfileDisplayLabel(nutritionStatus)}`,
      className:
        nutritionStatus === "needs_review"
          ? "bg-warning/10 text-warning"
          : "bg-danger/10 text-danger",
    })
  }
  if (isLowBalance) {
    badges.push({ label: "💳 Low Balance", className: "bg-danger/10 text-danger" })
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => router.push(profileHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(profileHref)
        }
      }}
      className={cn(
        PARENT_CARD,
        "group flex h-full min-h-[380px] cursor-pointer flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-4">
        <Image
          src={student.photo}
          alt={fullName}
          width={72}
          height={72}
          className="h-[72px] w-[72px] shrink-0 rounded-[14px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold" style={{ color: PARENT_NAVY }}>
            {fullName}
          </h3>
          <p className="mt-0.5 text-sm text-[#64748B]">Grade {student.grade}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  badge.className
                )}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#C8CDD7] py-4">
        <Metric label="Balance" value={formatCurrency(student.balance)} alert={isLowBalance} />
        <Metric
          label="Recent Purchase"
          value={recentPurchase ? formatCurrency(recentPurchase.amount) : "—"}
        />
        <Metric label="Meal Status" value={mealStatus} alert={isLowBalance} />
      </div>

      <div className="mt-4 flex-1 space-y-2 text-sm">
        <p className="text-[#64748B]">
          <span className="font-medium" style={{ color: PARENT_NAVY }}>
            Today&apos;s Lunch:
          </span>{" "}
          {todaysMenuItems[0]}
        </p>
        <p className="text-[#64748B]">
          <span className="font-medium" style={{ color: PARENT_NAVY }}>
            Recent:
          </span>{" "}
          {recentPurchase
            ? `${recentPurchase.description} ${formatCurrency(recentPurchase.amount)}`
            : "No recent activity"}
        </p>
      </div>

      <div className="mt-5 flex gap-3" onClick={(e) => e.stopPropagation()}>
        <Button
          asChild
          variant="outline"
          className="h-10 flex-1 rounded-[14px] border-[#C8CDD7] text-sm font-semibold"
          style={{ color: PARENT_NAVY }}
        >
          <Link href={profileHref}>
            <User className="mr-1.5 h-4 w-4" />
            Open Profile
          </Link>
        </Button>
        <Button
          type="button"
          className="h-10 flex-1 rounded-[14px] text-sm font-semibold"
          style={{ backgroundColor: PARENT_NAVY }}
          onClick={() => setFundingOpen(true)}
        >
          <Wallet className="mr-1.5 h-4 w-4" />
          Add Funds
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 flex-1 rounded-[14px] border-[#C8CDD7] text-sm font-semibold"
          style={{ color: PARENT_NAVY }}
        >
          <Link href="/parent/meal-history">
            <History className="mr-1.5 h-4 w-4" />
            Meal History
          </Link>
        </Button>
      </div>

      <AddFundsModal
        open={fundingOpen}
        onOpenChange={setFundingOpen}
        studentId={student.id}
        studentName={fullName}
        balance={student.balance}
      />
    </article>
  )
}

function Metric({
  label,
  value,
  alert = false,
}: {
  label: string
  value: string
  alert?: boolean
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B]">{label}</p>
      <p
        className={cn("mt-1 text-sm font-bold tabular-nums", alert && "text-danger")}
        style={alert ? undefined : { color: PARENT_NAVY }}
      >
        {value}
      </p>
    </div>
  )
}
