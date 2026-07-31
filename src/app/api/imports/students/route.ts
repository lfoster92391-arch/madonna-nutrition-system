import { NextResponse } from "next/server"
import { importStudentRows } from "@/lib/admin/student-import"
import { requireAdmin } from "@/lib/api/admin-auth"
import { studentImportRequestSchema, studentImportRowSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { parseImportRows } from "@/lib/import-export/coerce"

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

      const { valid, errors: parseErrors } = parseImportRows(
        parsed.data.rows,
        studentImportRowSchema,
        { rowNumberOffset: 1 }
      )

      if (valid.length === 0) {
        return NextResponse.json({
          matched: 0,
          created: 0,
          updated: 0,
          skipped: parseErrors.length,
          errors: parseErrors,
          rowOutcomes: parseErrors.map((error) => ({
            row: error.row,
            mdId: "",
            status: "error",
            message: error.message,
          })),
        })
      }

      const summary = await importStudentRows({
        rows: valid.map((row) => ({ ...row.data, _rowNumber: row.rowNumber })),
        schoolId: auth.schoolId,
        performedBy: parsed.data.performedBy,
        updateExisting: parsed.data.updateExisting ?? true,
      })

      return NextResponse.json({
        ...summary,
        errors: [...parseErrors, ...summary.errors],
        skipped: summary.skipped + parseErrors.length,
        rowOutcomes: [
          ...parseErrors.map((error) => ({
            row: error.row,
            mdId: "",
            status: "error",
            message: error.message,
          })),
          ...summary.rowOutcomes,
        ],
      })
    } catch (error) {
      console.error("POST /api/imports/students", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
