import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import { getTemplate } from "@/lib/import-export/templates"
import { rowsToCsv } from "@/lib/import-export/csv"
import { withDatabase } from "@/lib/api/response"

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const adminUserId = request.headers.get("x-admin-user-id")
    const auth = await requireAdmin(adminUserId)
    if ("error" in auth) return auth.error

    const template = getTemplate("families")
    const headers = template.columns.map((column) => column.key)
    const csv = rowsToCsv(headers, [template.sampleRow])

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${template.filename}"`,
      },
    })
  })

  return result instanceof NextResponse ? result : result
}
