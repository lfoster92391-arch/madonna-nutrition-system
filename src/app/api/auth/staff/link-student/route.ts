import { NextResponse } from "next/server"
import { parentLinkStudentSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { linkStaffUserToStudent, getStaffLinkedStudents } from "@/lib/auth/staff-links"
import { requireMutatingSession } from "@/lib/api/session-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["STAFF"])
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = parentLinkStudentSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid link request", parsed.error.flatten())
      }

      const linked = await linkStaffUserToStudent({
        staffUserId: auth.user.id,
        studentExternalId: parsed.data.studentExternalId,
      })

      return NextResponse.json({
        success: true,
        linkedStudentIds: linked.linkedStudentIds,
        studentName: linked.studentName,
        hasLinkedStudents: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not link student"
      if (message === "Student not found" || message.includes("Only staff")) {
        return badRequest(message)
      }
      console.error("POST /api/auth/staff/link-student", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["STAFF"])
      if ("error" in auth) return auth.error

      const students = await getStaffLinkedStudents(auth.user.id)
      return NextResponse.json({
        hasLinkedStudents: students.length > 0,
        students,
      })
    } catch (error) {
      console.error("GET /api/auth/staff/link-student", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
