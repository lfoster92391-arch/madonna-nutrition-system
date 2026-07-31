import { NextResponse } from "next/server"
import { importBadgeRows } from "@/lib/admin/badge-import"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badgeImportRequestSchema, badgeImportRowSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { parseImportRows } from "@/lib/import-export/coerce"

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

      const { valid, errors: parseErrors } = parseImportRows(
        parsed.data.rows,
        badgeImportRowSchema,
        { rowNumberOffset: 2 }
      )

      if (valid.length === 0) {
        return NextResponse.json({
          matched: 0,
          updated: 0,
          created: 0,
          skipped: parseErrors.length,
          incomplete: [],
          errors: parseErrors,
        })
      }

      const summary = await importBadgeRows({
        rows: valid.map((row) => ({ ...row.data, _rowNumber: row.rowNumber })),
        schoolId: auth.schoolId,
        createIncompleteStubs: parsed.data.createIncompleteStubs,
      })

      return NextResponse.json({
        ...summary,
        errors: [...parseErrors, ...summary.errors],
        skipped: summary.skipped + parseErrors.length,
      })
    } catch (error) {
      console.error("POST /api/imports/badges", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
