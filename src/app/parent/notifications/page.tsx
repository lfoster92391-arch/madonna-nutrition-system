import { redirectToParentHub } from "@/lib/parent-v3-redirect"

export default function NotificationsPage() {
  redirectToParentHub("alerts")
}
