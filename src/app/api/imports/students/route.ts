import { NextResponse } from "next/server"
import { importStudentRows } from "@/lib/admin/student-import"
import { requireAdmin } from "@/lib/api/admin-auth"
import { studentImportRequestSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = studentImportRequestSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid student import payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const summary = await importStudentRows({
        rows: parsed.data.rows,
        schoolId: auth.schoolId,
        performedBy: parsed.data.performedBy,
        updateExisting: parsed.data.updateExisting ?? true,
      })

      return NextResponse.json(summary)
    } catch (error) {
      console.error("POST /api/imports/students", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
