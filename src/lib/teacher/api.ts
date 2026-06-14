import { NextResponse } from "next/server"
import { assertTeacherUser, TeacherAccessError } from "@/lib/auth/teacher-access"
import { badRequest, notFound, withDatabase } from "@/lib/api/response"

export function teacherErrorResponse(error: unknown) {
  if (error instanceof TeacherAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
  throw error
}

export async function withTeacherAccess<T>(
  teacherId: string | null,
  handler: (teacher: Awaited<ReturnType<typeof assertTeacherUser>>) => Promise<T>
): Promise<T | NextResponse> {
  if (!teacherId) {
    return badRequest("teacherId is required")
  }

  const result = await withDatabase(async () => {
    try {
      const teacher = await assertTeacherUser(teacherId)
      return await handler(teacher)
    } catch (error) {
      return teacherErrorResponse(error)
    }
  })

  return result instanceof NextResponse ? result : result
}
