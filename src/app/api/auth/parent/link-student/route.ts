import { NextResponse } from "next/server"
import { parentLinkStudentSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { linkParentUserToStudent, parentHasLinkedStudents } from "@/lib/auth/parent-links"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { PARENT_PORTAL_DB_ROLES } from "@/lib/auth/portal-roles"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, [...PARENT_PORTAL_DB_ROLES])
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = parentLinkStudentSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid link request", parsed.error.flatten())
      }

      const linked = await linkParentUserToStudent({
        parentUserId: auth.user.id,
        studentExternalId: parsed.data.studentExternalId,
        relationship: parsed.data.relationship,
      })

      return NextResponse.json({
        success: true,
        linkedStudentIds: linked.linkedStudentIds,
        studentName: linked.studentName,
        hasLinkedStudents: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not link student"
      if (message === "Student not found" || message.includes("Only parent")) {
        return badRequest(message)
      }
      console.error("POST /api/auth/parent/link-student", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, [...PARENT_PORTAL_DB_ROLES])
      if ("error" in auth) return auth.error

      const hasLinkedStudents = await parentHasLinkedStudents(auth.user.id)
      return NextResponse.json({ hasLinkedStudents })
    } catch (error) {
      console.error("GET /api/auth/parent/link-student", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
