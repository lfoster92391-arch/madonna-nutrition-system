import { NextResponse } from "next/server"
import { z } from "zod"
import { DEFAULT_AGREEMENT_CONTENT } from "@/config/agreement-defaults"
import { badRequest, withDatabase } from "@/lib/api/response"
import {
  createAgreementVersion,
  listAgreementVersions,
} from "@/lib/agreements/service"

const contentSchema = z.object({
  mealSignUpPolicy: z.string().min(1),
  pricing: z.object({
    mainMeal: z.number().nonnegative(),
    premiumSides: z.number().nonnegative(),
    lightMeal: z.number().nonnegative(),
    drinks: z.number().nonnegative(),
  }),
  responsibilities: z.string().min(1),
})

const createSchema = z.object({
  versionLabel: z.string().min(1),
  effectiveDate: z.string().datetime(),
  expiresAt: z.string().datetime().nullable().optional(),
  content: contentSchema.optional(),
  performedBy: z.string().optional(),
})

export async function GET() {
  const result = await withDatabase(async () => {
    const versions = await listAgreementVersions()
    return NextResponse.json(versions)
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid agreement version payload", parsed.error.flatten())

    const version = await createAgreementVersion({
      versionLabel: parsed.data.versionLabel,
      effectiveDate: new Date(parsed.data.effectiveDate),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      content: parsed.data.content ?? DEFAULT_AGREEMENT_CONTENT,
      performedBy: parsed.data.performedBy,
    })
    return NextResponse.json(version, { status: 201 })
  })
  return result instanceof NextResponse ? result : result
}
