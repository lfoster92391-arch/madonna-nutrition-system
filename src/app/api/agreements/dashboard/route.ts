import { NextResponse } from "next/server"
import { withDatabase } from "@/lib/api/response"
import {
  getRecentAgreementNotifications,
  listAgreementDashboard,
  listAgreementEnrollmentStatus,
} from "@/lib/agreements/service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parentQuery = searchParams.get("parent") ?? undefined
  const studentQuery = searchParams.get("student") ?? undefined
  const signedAfter = searchParams.get("signedAfter") ?? undefined
  const signedBefore = searchParams.get("signedBefore") ?? undefined

  const result = await withDatabase(async () => {
    const [rows, enrollment, notifications] = await Promise.all([
      listAgreementDashboard({ parentQuery, studentQuery }),
      listAgreementEnrollmentStatus({
        parentQuery,
        studentQuery,
        signedAfter,
        signedBefore,
      }),
      getRecentAgreementNotifications(),
    ])
    return NextResponse.json({ rows, enrollment, notifications })
  })
  return result instanceof NextResponse ? result : result
}
