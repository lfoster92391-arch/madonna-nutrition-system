import { NextResponse } from "next/server"
import {
  DEFAULT_ONBOARDING_PRICING,
  MILK_JUICE_PRICE,
  STUDENT_LUNCH_PRICE,
} from "@/config/onboarding-pricing"
import { withDatabase } from "@/lib/api/response"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const pricing = await prisma.onboardingPricing.findUnique({ where: { schoolId } })
    if (!pricing) return NextResponse.json(DEFAULT_ONBOARDING_PRICING)
    return NextResponse.json({
      mainMealPrice: STUDENT_LUNCH_PRICE,
      sideMealPrice: Number(pricing.sideMealPrice),
      alaCartePrice: Number(pricing.alaCartePrice),
      milkPrice: MILK_JUICE_PRICE,
      juicePrice: MILK_JUICE_PRICE,
      agreementText: pricing.agreementText,
      emergencyPolicyText: pricing.emergencyPolicyText,
    })
  })
  if (result instanceof NextResponse && result.status === 503) {
    return NextResponse.json(DEFAULT_ONBOARDING_PRICING)
  }
  return result
}
