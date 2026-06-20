import { redirect } from "next/navigation"

export default function MealHistoryPage() {
  redirect("/parent?drawer=meal-activity")
}
