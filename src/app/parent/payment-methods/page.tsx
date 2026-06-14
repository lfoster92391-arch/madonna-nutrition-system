import { redirect } from "next/navigation"

/** Legacy route — redirects to unified Payments Center billing tab. */
export default function PaymentMethodsPage() {
  redirect("/parent/payments?tab=billing")
}
