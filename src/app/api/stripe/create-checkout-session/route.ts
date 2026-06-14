import { NextResponse } from "next/server"
import { assertParentOwnsStudent, ParentAccessError } from "@/lib/auth/parent-access"
import { createCheckoutSessionSchema } from "@/lib/payments/schemas"
import { getAppUrl, getStripe, isStripeConfigured } from "@/lib/stripe"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments not configured", configured: false },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createCheckoutSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { studentId, parentUserId, amountDollars } = parsed.data

  try {
    const { schoolId, studentName, billingStudentId } = await assertParentOwnsStudent(
      parentUserId,
      studentId
    )

    const stripe = getStripe()
    const appUrl = getAppUrl()
    const amountCents = Math.round(amountDollars * 100)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: "Cafeteria Account Deposit",
              description: `Add funds for ${studentName} — Madonna High School`,
            },
          },
        },
      ],
      metadata: {
        studentId: billingStudentId,
        studentExternalId: studentId,
        schoolId,
        parentUserId,
        amountDollars: amountDollars.toFixed(2),
      },
      success_url: `${appUrl}/parent/add-funds?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/parent/add-funds?canceled=1`,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    if (error instanceof ParentAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error("[stripe/create-checkout-session]", error)
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 })
  }
}
