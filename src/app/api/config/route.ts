import { NextResponse } from "next/server"
import { isDatabaseEnabled } from "@/lib/db/config"
import { isStripeConfigured } from "@/lib/stripe"

export async function GET() {
  return NextResponse.json({
    databaseEnabled: isDatabaseEnabled(),
    stripeConfigured: isStripeConfigured(),
  })
}
