import { NextResponse } from "next/server"
import { importVendorRows } from "@/lib/procurement/vendors"
import { requireAdmin } from "@/lib/api/admin-auth"
import { vendorImportRequestSchema, vendorImportRowSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { parseImportRows } from "@/lib/import-export/coerce"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = vendorImportRequestSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid vendor import payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const { valid, errors: parseErrors } = parseImportRows(
        parsed.data.rows,
        vendorImportRowSchema,
        { rowNumberOffset: 1 }
      )

      if (valid.length === 0) {
        return NextResponse.json({
          created: 0,
          updated: 0,
          skipped: parseErrors.length,
          errors: parseErrors,
        })
      }

      const summary = await importVendorRows({
        rows: valid.map((row) => ({ ...row.data, _rowNumber: row.rowNumber })),
        schoolId: auth.schoolId,
      })

      return NextResponse.json({
        ...summary,
        errors: [...parseErrors, ...summary.errors],
        skipped: summary.skipped + parseErrors.length,
      })
    } catch (error) {
      console.error("POST /api/imports/vendors", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
