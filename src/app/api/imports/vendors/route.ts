import { NextResponse } from "next/server"
import { importVendorRows } from "@/lib/procurement/vendors"
import { requireAdmin } from "@/lib/api/admin-auth"
import { vendorImportRequestSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

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

      const summary = await importVendorRows({
        rows: parsed.data.rows,
        schoolId: auth.schoolId,
      })

      return NextResponse.json(summary)
    } catch (error) {
      console.error("POST /api/imports/vendors", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
