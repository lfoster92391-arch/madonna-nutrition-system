import { redirect } from "next/navigation"

export default function AddFundsPage() {
  redirect("/parent?drawer=add-funds")
}
