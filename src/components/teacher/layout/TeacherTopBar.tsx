"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Bell,
  ChevronDown,
  MessageSquare,
  User,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import {
  TEACHER_BG,
  TEACHER_DANGER,
  TEACHER_NAVY,
  TEACHER_SILVER,
} from "@/components/teacher/layout/teacher-theme"

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

export function TeacherTopBar() {
  const { user } = useAuth()
  const { profile } = useTeacherData()
  const teacherName = profile?.displayName ?? user?.displayName ?? "Teacher"
  const today = useMemo(() => formatToday(), [])

  return (
    <header
      className="flex h-[68px] shrink-0 items-center gap-4 border-b px-6"
      style={{ borderColor: TEACHER_SILVER, backgroundColor: "#FFFFFF" }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold" style={{ color: TEACHER_NAVY }}>
          Welcome back, {teacherName}
        </p>
        <p className="truncate text-sm" style={{ color: TEACHER_SILVER }}>
          Here&apos;s what&apos;s happening with lunch today.
        </p>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium shadow-sm"
          style={{ borderColor: TEACHER_SILVER, color: TEACHER_NAVY }}
        >
          {DEMO_SCHOOL.name}
          <ChevronDown className="h-4 w-4" style={{ color: TEACHER_SILVER }} />
        </button>
        <span
          className="rounded-2xl px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: TEACHER_BG, color: TEACHER_NAVY }}
        >
          {today}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TopBarIconButton icon={Bell} label="Notifications" badge={2} />
        <Link href="/teacher/messages">
          <TopBarIconButton icon={MessageSquare} label="Messages" badge={1} />
        </Link>
        <Link
          href="/teacher/settings"
          className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-[#0A1E3F]/5"
          style={{ borderColor: TEACHER_SILVER, color: TEACHER_NAVY }}
          aria-label="Teacher profile"
        >
          {profile?.photoUrl ? (
            <Image
              src={profile.photoUrl}
              alt={teacherName}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{teacherName.split(" ")[0]}</span>
        </Link>
      </div>
    </header>
  )
}

function TopBarIconButton({
  icon: Icon,
  label,
  badge,
}: {
  icon: typeof Bell
  label: string
  badge?: number
}) {
  return (
    <button
      type="button"
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm transition hover:bg-[#0A1E3F]/5"
      style={{ borderColor: TEACHER_SILVER, color: TEACHER_NAVY }}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      {badge ? (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: TEACHER_DANGER }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}
