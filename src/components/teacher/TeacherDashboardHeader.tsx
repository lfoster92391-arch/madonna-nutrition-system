"use client"

import Image from "next/image"
import { Bell } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { TEACHER_NAVY } from "@/data/demo/teacher"

interface TeacherDashboardHeaderProps {
  subtitle?: string
}

export function TeacherDashboardHeader({ subtitle = "Teacher Portal" }: TeacherDashboardHeaderProps) {
  const { user } = useAuth()
  const { profile } = useTeacherData()
  const firstName = profile?.displayName.split(" ")[0] ?? user?.displayName.split(" ")[0] ?? "Teacher"

  return (
    <header className="border-b bg-white px-8 py-6" style={{ borderColor: "#AEB6C2" }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: TEACHER_NAVY }}
          >
            {subtitle}
          </p>
          <h1 className="mt-1 text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
            Welcome back, {firstName}!
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="relative rounded-2xl p-3 hover:bg-[#AEB6C2]/20"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" style={{ color: TEACHER_NAVY }} />
            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
              3
            </span>
          </button>
          <div className="flex items-center gap-3">
            {profile?.photoUrl ? (
              <Image
                src={profile.photoUrl}
                alt={profile.displayName}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : null}
            <div className="text-right">
              <p className="font-semibold" style={{ color: TEACHER_NAVY }}>
                {profile?.displayName ?? user?.displayName}
              </p>
              <p className="text-sm" style={{ color: "#AEB6C2" }}>
                {profile?.department}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
