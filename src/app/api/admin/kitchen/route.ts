import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badRequest, withDatabase } from "@/lib/api/response"
import { loadKitchenBoard } from "@/lib/kitchen/board-data"
import { schoolDateKey } from "@/lib/kitchen/school-day"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const adminUserId =
      request.headers.get("x-admin-user-id") ?? request.headers.get("x-session-user-id")
    const auth = await requireAdmin(adminUserId, request)
    if ("error" in auth) return auth.error

    const dateParam = new URL(request.url).searchParams.get("date")
    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return badRequest("date must be YYYY-MM-DD")
    }

    const payload = await loadKitchenBoard(auth.schoolId, dateParam ?? schoolDateKey())
    return NextResponse.json(payload)
  })
  return result instanceof NextResponse ? result : result
}
