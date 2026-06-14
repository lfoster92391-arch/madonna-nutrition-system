import { NextResponse } from "next/server"
import { isDatabaseEnabled } from "@/lib/db/config"

export function dbUnavailableResponse() {
  return NextResponse.json(
    { error: "Database is not configured. Set DATABASE_URL to enable persistence." },
    { status: 503 }
  )
}

export async function withDatabase<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  if (!isDatabaseEnabled()) {
    return dbUnavailableResponse()
  }
  try {
    return await handler()
  } catch (error) {
    console.error("Database handler failed:", error)
    return serverError("Database request failed.")
  }
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 })
}
