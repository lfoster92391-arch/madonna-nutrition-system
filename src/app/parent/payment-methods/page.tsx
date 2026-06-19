import { redirect } from "next/navigation"

export default function PaymentMethodsPage() {
  redirect("/parent/payments?tab=methods")
}
