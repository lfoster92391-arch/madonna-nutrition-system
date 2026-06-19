import { Suspense } from "react"
import { StudentHubPage } from "@/components/parent/student-hub/StudentHubPage"

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <StudentHubPage />
    </Suspense>
  )
}
