import { redirect } from "next/navigation"

export default function AlertsPage() {
  redirect("/parent/settings#notifications")
}
