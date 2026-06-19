import { NextResponse } from "next/server"
import { DEFAULT_PUBLISHED_VERSION } from "@/config/agreement-defaults"
import { withDatabase } from "@/lib/api/response"
import { getCurrentPublishedAgreement } from "@/lib/agreements/service"

export async function GET() {
  const result = await withDatabase(async () => {
    const version = await getCurrentPublishedAgreement()
    if (!version) {
      return NextResponse.json(null)
    }
    return NextResponse.json(version)
  })
  if (result instanceof NextResponse && result.status === 503) {
    return NextResponse.json(DEFAULT_PUBLISHED_VERSION)
  }
  return result instanceof NextResponse ? result : result
}
