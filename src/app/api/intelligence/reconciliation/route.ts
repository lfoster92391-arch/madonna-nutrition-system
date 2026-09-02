import { NextResponse } from "next/server"
import { isDatabaseEnabled } from "@/lib/db/config"
import { parseMonthParam } from "@/lib/dates/month-range"
import { computeReconciliation, mockReconciliation, tryCompute } from "@/lib/intelligence/compute"

export async function GET(request: Request) {
  const month = parseMonthParam(new URL(request.url).searchParams.get("month")) ?? undefined

  if (!isDatabaseEnabled()) {
    return NextResponse.json({ ...mockReconciliation, month: month ?? mockReconciliation.month })
  }
  const data = await tryCompute(
    () => computeReconciliation(month),
    { ...mockReconciliation, month: month ?? mockReconciliation.month }
  )
  return NextResponse.json(data)
}
