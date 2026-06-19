import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, withDatabase } from "@/lib/api/response"
import { getClientIp } from "@/lib/agreements/ip"
import { signAgreement } from "@/lib/agreements/service"

const schema = z.object({
  parentUserId: z.string().min(1),
  parentName: z.string().min(2),
  relationship: z.string().min(2),
  typedSignature: z.string().min(2),
  acceptedTerms: z.literal(true),
})

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid sign payload", parsed.error.flatten())

    try {
      const signature = await signAgreement({
        ...parsed.data,
        ipAddress: getClientIp(request),
      })
      return NextResponse.json(
        {
          signature,
          receipt: {
            message: "Cafeteria agreement signed successfully.",
            parentName: signature.parentName,
            students: signature.studentNames,
            signedAt: signature.signedAt,
            versionLabel: signature.versionLabel,
          },
          notification: {
            title: "New Cafeteria Agreement Signed",
            parentName: signature.parentName,
            studentCount: signature.studentIds.length,
            signedAt: signature.signedAt,
            viewPath: `/admin/agreements?signature=${signature.id}`,
          },
        },
        { status: 201 }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign agreement"
      return badRequest(message)
    }
  })
  return result instanceof NextResponse ? result : result
}
