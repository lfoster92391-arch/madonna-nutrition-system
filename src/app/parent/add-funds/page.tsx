import { Suspense } from "react"
import { AddFundsForm } from "@/components/parent/AddFundsForm"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"

export default function AddFundsPage() {
  return (
    <div className={`mx-auto w-full max-w-3xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
        <AddFundsForm />
      </Suspense>
    </div>
  )
}
