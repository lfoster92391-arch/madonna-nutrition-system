import { NextResponse } from "next/server"
import { DEFAULT_ONBOARDING_PRICING } from "@/config/onboarding-pricing"
import { withDatabase } from "@/lib/api/response"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const pricing = await prisma.onboardingPricing.findUnique({ where: { schoolId } })
    if (!pricing) return NextResponse.json(DEFAULT_ONBOARDING_PRICING)
    return NextResponse.json({
      mainMealPrice: Number(pricing.mainMealPrice),
      sideMealPrice: Number(pricing.sideMealPrice),
      alaCartePrice: Number(pricing.alaCartePrice),
      milkPrice: Number(pricing.milkPrice),
      agreementText: pricing.agreementText,
      emergencyPolicyText: pricing.emergencyPolicyText,
    })
  })
  if (result instanceof NextResponse && result.status === 503) {
    return NextResponse.json(DEFAULT_ONBOARDING_PRICING)
  }
  return result
}
