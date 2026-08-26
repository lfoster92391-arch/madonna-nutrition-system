import { NextResponse } from "next/server"
import { requireWorkplaceLunchSignupSession } from "@/lib/auth/workplace-lunch"
import { badRequest, withDatabase } from "@/lib/api/response"
import { schoolDateKey } from "@/lib/kitchen/school-day"
import { loadLunchSignupRoster } from "@/lib/workplace/lunch-signup-roster"

export const dynamic = "force-dynamic"

/**
 * Who signed up for lunch — student names/MD IDs/meals/dates for today + school week.
 * TEACHER / STAFF / ADMIN / CASHIER. No balances or prices.
 */
export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const auth = await requireWorkplaceLunchSignupSession(request)
    if ("error" in auth) return auth.error

    const dateParam = new URL(request.url).searchParams.get("date")
    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return badRequest("date must be YYYY-MM-DD")
    }

    const payload = await loadLunchSignupRoster(auth.schoolId, dateParam ?? schoolDateKey())
    return NextResponse.json(payload)
  })
  return result instanceof NextResponse ? result : result
}
