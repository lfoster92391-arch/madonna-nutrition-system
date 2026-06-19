import { NextResponse } from "next/server"
import { withDatabase } from "@/lib/api/response"
import {
  getRecentAgreementNotifications,
  listAgreementDashboard,
} from "@/lib/agreements/service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parentQuery = searchParams.get("parent") ?? undefined
  const studentQuery = searchParams.get("student") ?? undefined

  const result = await withDatabase(async () => {
    const [rows, notifications] = await Promise.all([
      listAgreementDashboard({ parentQuery, studentQuery }),
      getRecentAgreementNotifications(),
    ])
    return NextResponse.json({ rows, notifications })
  })
  return result instanceof NextResponse ? result : result
}
