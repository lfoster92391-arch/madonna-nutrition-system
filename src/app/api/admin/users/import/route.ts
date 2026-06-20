import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import { familyImportRequestSchema } from "@/lib/api/validation"
import { badRequest, withDatabase } from "@/lib/api/response"
import { importFamilyRows } from "@/lib/admin/family-import"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = familyImportRequestSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid import payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const importResult = await importFamilyRows({
        rows: parsed.data.rows,
        schoolId: auth.schoolId,
        performedBy: parsed.data.performedBy,
      })

      return NextResponse.json(importResult)
    } catch (error) {
      console.error("POST /api/admin/users/import", error)
      return NextResponse.json({ error: "Import failed" }, { status: 500 })
    }
  })

  return result instanceof NextResponse ? result : result
}
