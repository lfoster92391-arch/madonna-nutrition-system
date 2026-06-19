import { Suspense } from "react"
import { MealActivityView } from "@/components/parent/meals/MealActivityView"

export default function MealHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <MealActivityView />
    </Suspense>
  )
}
