import { WorkerNavigationGuide } from "@/components/admin/WorkerNavigationGuide"
import { UserManager } from "@/components/admin/UserManager"

export default function AdminSetupPage() {
  return (
    <>
      <div className="w-full px-6 py-8 md:px-8">
        <div className="mx-auto max-w-full">
          <WorkerNavigationGuide />
        </div>
      </div>
      <UserManager />
    </>
  )
}
