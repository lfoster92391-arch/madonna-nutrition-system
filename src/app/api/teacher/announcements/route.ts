import { NextResponse } from "next/server"
import { withTeacherAccess } from "@/lib/teacher/api"
import { demoTeacherAnnouncements } from "@/data/demo/teacher"

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId")
  return withTeacherAccess(teacherId, async () => {
    return NextResponse.json({ announcements: demoTeacherAnnouncements })
  })
}
