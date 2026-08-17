import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { refreshStudentGradesFromEmail } from "@/lib/students/refresh-grades"
import { z } from "zod"

const bodySchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1).optional(),
})

/**
 * Admin refresh: recompute all student grades from email class year and
 * archive past graduates (disabled + inactive badge).
 * Call at the start of each school year (or anytime) — bumping is deterministic
 * from ACADEMIC_SENIOR_GRAD_YEAR / July rollover.
 */
export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = bodySchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid refresh payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const summary = await refreshStudentGradesFromEmail({
        schoolId: auth.schoolId,
        performedBy: parsed.data.performedBy ?? parsed.data.adminUserId,
      })

      return NextResponse.json(summary)
    } catch (error) {
      console.error("POST /api/admin/students/refresh-grades", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
