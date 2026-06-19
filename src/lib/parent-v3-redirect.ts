import { redirect } from "next/navigation"

/** Legacy parent routes → V3 family hub with drawer query params */
export function redirectToParentHub(
  drawer?: "add-funds" | "meal-activity" | "alerts" | "settings"
) {
  if (drawer) {
    redirect(`/parent?drawer=${drawer}`)
  }
  redirect("/parent")
}
