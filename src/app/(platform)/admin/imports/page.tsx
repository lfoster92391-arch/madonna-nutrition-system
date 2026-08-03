import { Suspense } from "react"
import { AdminImportsHub } from "@/components/admin/AdminImportsHub"

export default function AdminImportsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white p-8 text-silver-foreground">Loading…</div>}>
      <AdminImportsHub />
    </Suspense>
  )
}
