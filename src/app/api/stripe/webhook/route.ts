import { NextResponse } from "next/server"
import Stripe from "stripe"
import { creditStudentDeposit } from "@/lib/db/deposits"
import { isDatabaseEnabled } from "@/lib/db/config"
import { getStripe } from "@/lib/stripe"
import { sendDepositConfirmationEmail } from "@/lib/email"
import { sendSecurityAlert } from "@/lib/security/alerts"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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
        await sendDepositConfirmationEmail({
          to: parentUser.email,
          amount: `$${amountDollars.toFixed(2)}`,
          studentName: `${student.firstName} ${student.lastName}`,
          balanceAfter: `$${result.balanceAfter.toFixed(2)}`,
          userId: parentUserId,
          studentId,
          stripeSessionId: session.id,
        })
      }
    }
  } catch (error) {
    console.error("[stripe/webhook] failed to credit deposit", error)
    return NextResponse.json({ error: "Failed to record deposit" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleDispute(event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute
  const amount = (dispute.amount / 100).toFixed(2)
  void sendSecurityAlert({
    kind: "stripe_dispute",
    subject: `Stripe dispute ${dispute.status}: $${amount}`,
    body: [
      "A Stripe card dispute (chargeback) event was received.",
      "",
      `Event: ${event.type}`,
      `Dispute id: ${dispute.id}`,
      `Status: ${dispute.status}`,
      `Reason: ${dispute.reason ?? "(none)"}`,
      `Amount: $${amount} ${dispute.currency?.toUpperCase() ?? ""}`,
      `Payment intent: ${typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id ?? "(none)"}`,
      "",
      "Review the payment in Stripe Dashboard. Card numbers are never stored in Fuel The Dons.",
    ].join("\n"),
    metadata: {
      eventType: event.type,
      disputeId: dispute.id,
      status: dispute.status,
      reason: dispute.reason,
    },
  })
  return NextResponse.json({ received: true })
}

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
    return handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
  }

  if (
    event.type === "charge.dispute.created" ||
    event.type === "charge.dispute.updated" ||
    event.type === "charge.dispute.closed"
  ) {
    return handleDispute(event)
  }

  return NextResponse.json({ received: true })
}
