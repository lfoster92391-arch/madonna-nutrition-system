import { redirectToParentHub } from "@/lib/parent-v3-redirect"

export default function PaymentsPage() {
  redirectToParentHub("add-funds")
}
