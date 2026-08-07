import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import { familyImportRequestSchema, familyImportRowSchema } from "@/lib/api/validation"
import { badRequest, withDatabase } from "@/lib/api/response"
import { importFamilyRows } from "@/lib/admin/family-import"
import { parseImportRows } from "@/lib/import-export/coerce"

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

      const { valid, errors: parseErrors } = parseImportRows(
        parsed.data.rows,
        familyImportRowSchema,
        { rowNumberOffset: 1 }
      )

      if (valid.length === 0) {
        return NextResponse.json({
          created: 0,
          linked: 0,
          skipped: parseErrors.length,
          errors: parseErrors,
          credentials: [],
          welcomeEmails: { attempted: 0, sent: 0, failed: [] },
        })
      }

      const importResult = await importFamilyRows({
        rows: valid.map((row) => ({ ...row.data, _rowNumber: row.rowNumber })),
        schoolId: auth.schoolId,
        performedBy: parsed.data.performedBy,
      })

      return NextResponse.json({
        ...importResult,
        errors: [...parseErrors, ...importResult.errors],
        skipped: importResult.skipped + parseErrors.length,
      })
    } catch (error) {
      console.error("POST /api/admin/users/import", error)
      return NextResponse.json({ error: "Import failed" }, { status: 500 })
    }
  })

  return result instanceof NextResponse ? result : result
}
