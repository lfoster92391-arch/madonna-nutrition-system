import { NextResponse } from "next/server"
import Stripe from "stripe"
import { creditStudentDeposit } from "@/lib/db/deposits"
import { isDatabaseEnabled } from "@/lib/db/config"
import { getStripe } from "@/lib/stripe"
import { sendEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const body = await request.text()
  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("[stripe/webhook] signature verification failed", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "not_paid" })
    }

    const studentId = session.metadata?.studentId
    const schoolId = session.metadata?.schoolId
    const parentUserId = session.metadata?.parentUserId
    const amountRaw = session.metadata?.amountDollars

    if (!studentId || !schoolId || !amountRaw || !session.id) {
      console.error("[stripe/webhook] missing metadata", session.metadata)
      return NextResponse.json({ error: "Missing session metadata" }, { status: 400 })
    }

    const amountDollars = Number.parseFloat(amountRaw)
    if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
      return NextResponse.json({ error: "Invalid amount in metadata" }, { status: 400 })
    }

    if (!isDatabaseEnabled()) {
      console.warn(
        "[stripe/webhook] payment received but DATABASE_URL not set — balance not updated",
        session.id
      )
      return NextResponse.json({ received: true, databaseConfigured: false })
    }

    try {
      const result = await creditStudentDeposit({
        studentId,
        schoolId,
        amountDollars,
        stripeSessionId: session.id,
        performedBy: parentUserId ?? "stripe_webhook",
      })

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { externalId: true, firstName: true, lastName: true },
      })

      if (parentUserId) {
        const parentUser = await prisma.user.findUnique({
          where: { id: parentUserId },
          select: { email: true },
        })
        if (parentUser?.email && student) {
          await sendEmail({
            to: parentUser.email,
            subject: "Deposit Received",
            body: `$${amountDollars.toFixed(2)} was added to ${student.firstName} ${student.lastName}'s lunch account. New balance: $${result.balanceAfter.toFixed(2)}.`,
            type: "DEPOSIT_SUCCESS",
            userId: parentUserId,
            studentId,
            metadata: { stripeSessionId: session.id },
          })
        }
      }
    } catch (error) {
      console.error("[stripe/webhook] failed to credit deposit", error)
      return NextResponse.json({ error: "Failed to record deposit" }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
