import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badRequest, withDatabase } from "@/lib/api/response"
import { getEmailConfigStatus, sendTestEmail } from "@/lib/email"

const schema = z.object({
  adminUserId: z.string().min(1),
  to: z.string().email().optional(),
})

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest("Invalid test email payload", parsed.error.flatten())

    const auth = await requireAdmin(parsed.data.adminUserId)
    if ("error" in auth) return auth.error

    const to = parsed.data.to?.trim() || auth.admin.email
    if (!to) {
      return badRequest("No recipient email — set `to` or add an email to the admin account")
    }

    const config = getEmailConfigStatus()
    const delivery = await sendTestEmail({ to, userId: auth.admin.id })

    return NextResponse.json({
      to,
      config,
      sent: delivery.sent,
      stored: delivery.stored,
      error: delivery.error,
    })
  })

  return result instanceof NextResponse ? result : result
}
