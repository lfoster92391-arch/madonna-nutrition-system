"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getPendingSubmission,
  getStudentProfile,
  parentRecentActivity,
  todaysMenuItems,
} from "@/data/demo"
import type { Student } from "@/lib/types"
import { useDemo } from "@/components/providers/DemoProvider"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { getFoodProfileStatus, type FoodProfileStatus } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

const STATUS_BADGE: Record<
  FoodProfileStatus,
  { emoji: string; label: string; className: string }
> = {
  verified: { emoji: "🟢", label: "Verified", className: "bg-success/10 text-success" },
  pending_review: { emoji: "🟡", label: "Pending Review", className: "bg-warning/10 text-warning" },
  action_needed: { emoji: "🔴", label: "Action Needed", className: "bg-danger/10 text-danger" },
}

type StudentHubCardProps = {
  student: Student
}

export function StudentHubCard({ student }: StudentHubCardProps) {
  const router = useRouter()
  const { studentProfiles, allergySubmissions } = useDemo()

  const profile = getStudentProfile(student.id, studentProfiles)
  const pending = getPendingSubmission(student.id, allergySubmissions)
  const nutritionStatus = getFoodProfileStatus(profile, pending)
  const badge = STATUS_BADGE[nutritionStatus]

  const recentPurchase = parentRecentActivity.find((item) =>
    item.student.includes(student.firstName)
  )
  const mealStatus = student.balance < 5 ? "Low Balance" : "Active"
  const lastUpdated = profile?.allergyReviewedAt
    ? new Date(profile.allergyReviewedAt).toLocaleDateString()
    : "Not reviewed"

  const profileHref = `/parent/student-profile/${student.id}`

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
        "flex h-[380px] cursor-pointer flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md md:p-6"
      )}
    >
      <div className="flex items-start gap-4">
        <Image
          src={student.photo}
          alt={`${student.firstName} ${student.lastName}`}
          width={64}
          height={64}
          className="h-16 w-16 shrink-0 rounded-[12px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold md:text-lg" style={{ color: PARENT_NAVY }}>
            {student.firstName} {student.lastName}
          </h3>
          <p className="mt-0.5 text-sm text-[#64748B]">Grade {student.grade}</p>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              badge.className
            )}
          >
            <span aria-hidden>{badge.emoji}</span>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#C8CDD7] py-3 text-center">
        <StatusCell
          label="Balance"
          value={formatCurrency(student.balance)}
          tone={student.balance < 5 ? "danger" : "success"}
        />
        <StatusCell label="Meals" value={mealStatus} tone={student.balance < 5 ? "warning" : "default"} />
        <StatusCell label="Nutrition" value={badge.label.split(" ")[0]} tone={nutritionTone(nutritionStatus)} />
      </div>

      <div className="mt-4 flex-1 space-y-2 text-sm">
        <SnapshotRow label="Today's Lunch" value={todaysMenuItems[0] ?? "Menu unavailable"} />
        <SnapshotRow
          label="Recent Purchase"
          value={recentPurchase ? `${recentPurchase.description} (${recentPurchase.date})` : "No recent activity"}
        />
        <SnapshotRow label="Last Updated" value={lastUpdated} />
      </div>

      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <Button
          asChild
          variant="outline"
          className="h-10 flex-1 rounded-[10px] border-[#C8CDD7] text-sm font-semibold"
          style={{ color: PARENT_NAVY }}
        >
          <Link href={profileHref}>Open Profile</Link>
        </Button>
        <Button
          asChild
          className="h-10 flex-1 rounded-[10px] text-sm font-semibold"
          style={{ backgroundColor: PARENT_NAVY }}
        >
          <Link href={profileHref}>Food Profile</Link>
        </Button>
      </div>
    </article>
  )
}

function nutritionTone(status: FoodProfileStatus): "success" | "warning" | "danger" | "default" {
  if (status === "verified") return "success"
  if (status === "pending_review") return "warning"
  return "danger"
}

function StatusCell({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "success" | "warning" | "danger" | "default"
}) {
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-danger"
          : undefined

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p
        className={cn("mt-0.5 truncate text-xs font-bold tabular-nums md:text-sm", valueColor)}
        style={!valueColor ? { color: PARENT_NAVY } : undefined}
      >
        {value}
      </p>
    </div>
  )
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="shrink-0 text-[#64748B]">{label}</span>
      <span className="truncate text-right font-medium" style={{ color: PARENT_NAVY }}>
        {value}
      </span>
    </div>
  )
}
