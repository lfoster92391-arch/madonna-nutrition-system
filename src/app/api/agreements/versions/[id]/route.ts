import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, notFound, withDatabase } from "@/lib/api/response"
import { getAgreementVersionById, updateAgreementVersion } from "@/lib/agreements/service"

const updateSchema = z.object({
  versionLabel: z.string().min(1).optional(),
  effectiveDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  content: z
    .object({
      mealSignUpPolicy: z.string().min(1),
      pricing: z.object({
        mainMeal: z.number().nonnegative(),
        premiumSides: z.number().nonnegative(),
        lightMeal: z.number().nonnegative(),
        drinks: z.number().nonnegative(),
      }),
      responsibilities: z.string().min(1),
    })
    .optional(),
  performedBy: z.string().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await withDatabase(async () => {
    const version = await getAgreementVersionById(id)
    if (!version) return notFound("Agreement version not found")
    return NextResponse.json(version)
  })
  return result instanceof NextResponse ? result : result
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid update payload", parsed.error.flatten())

    const version = await updateAgreementVersion(id, {
      versionLabel: parsed.data.versionLabel,
      effectiveDate: parsed.data.effectiveDate ? new Date(parsed.data.effectiveDate) : undefined,
      expiresAt:
        parsed.data.expiresAt === undefined
          ? undefined
          : parsed.data.expiresAt
            ? new Date(parsed.data.expiresAt)
            : null,
      content: parsed.data.content,
      performedBy: parsed.data.performedBy,
    })
    if (!version) return notFound("Draft agreement version not found")
    return NextResponse.json(version)
  })
  return result instanceof NextResponse ? result : result
}
