import { NextResponse } from "next/server"
import { importBadgeRows } from "@/lib/admin/badge-import"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badgeImportRequestSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = badgeImportRequestSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid badge import payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId, request)
      if ("error" in auth) return auth.error

      const summary = await importBadgeRows({
        rows: parsed.data.rows,
        schoolId: auth.schoolId,
      })

      return NextResponse.json(summary)
    } catch (error) {
      console.error("POST /api/imports/badges", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
