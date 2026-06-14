import { NextResponse } from "next/server"
import { listAuditLogs } from "@/lib/db/audit"
import { withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const logs = await listAuditLogs()
    return NextResponse.json(logs)
  })
  return result instanceof NextResponse ? result : result
}
