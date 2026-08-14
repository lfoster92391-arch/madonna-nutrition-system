import { NextResponse } from "next/server"
import { DEFAULT_PUBLISHED_VERSION } from "@/config/agreement-defaults"
import { withDatabase } from "@/lib/api/response"
import { getCurrentPublishedAgreement } from "@/lib/agreements/service"

export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
}

export async function GET() {
  const result = await withDatabase(async () => {
    const version = await getCurrentPublishedAgreement()
    if (!version) {
      return NextResponse.json(null, { headers: NO_STORE })
    }
    return NextResponse.json(version, { headers: NO_STORE })
  })
  if (result instanceof NextResponse && result.status === 503) {
    return NextResponse.json(DEFAULT_PUBLISHED_VERSION, { headers: NO_STORE })
  }
  return result instanceof NextResponse ? result : result
}
