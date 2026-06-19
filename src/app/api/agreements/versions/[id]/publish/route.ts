import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, notFound, withDatabase } from "@/lib/api/response"
import { publishAgreementVersion } from "@/lib/agreements/service"

const schema = z.object({
  performedBy: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await withDatabase(async () => {
    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid publish payload", parsed.error.flatten())

    const version = await publishAgreementVersion(id, parsed.data.performedBy)
    if (!version) return notFound("Draft agreement version not found")
    return NextResponse.json(version)
  })
  return result instanceof NextResponse ? result : result
}
