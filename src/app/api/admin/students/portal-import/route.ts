import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import {
  studentPortalImportRequestSchema,
  studentPortalImportRowSchema,
} from "@/lib/api/validation"
import { badRequest, withDatabase } from "@/lib/api/response"
import { importStudentPortalRows } from "@/lib/admin/student-portal-import"
import { parseImportRows } from "@/lib/import-export/coerce"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = studentPortalImportRequestSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid import payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const { valid, errors: parseErrors } = parseImportRows(
        parsed.data.rows,
        studentPortalImportRowSchema,
        { rowNumberOffset: 1 }
      )

      if (valid.length === 0) {
        return NextResponse.json({
          created: 0,
          updated: 0,
          skipped: parseErrors.length,
          enabled: 0,
          errors: parseErrors,
          credentials: [],
        })
      }

      const importResult = await importStudentPortalRows({
        rows: valid.map((row) => ({ ...row.data, _rowNumber: row.rowNumber })),
        schoolId: auth.schoolId,
        performedBy: parsed.data.performedBy,
        defaultPassword: parsed.data.defaultPassword,
      })

      return NextResponse.json({
        ...importResult,
        errors: [...parseErrors, ...importResult.errors],
        skipped: importResult.skipped + parseErrors.length,
      })
    } catch (error) {
      console.error("POST /api/admin/students/portal-import", error)
      return NextResponse.json({ error: "Import failed" }, { status: 500 })
    }
  })

  return result instanceof NextResponse ? result : result
}
