import { WorkerNavigationGuide } from "@/components/admin/WorkerNavigationGuide"
import { UserManager } from "@/components/admin/UserManager"

export default function AdminSetupPage() {
  return (
    <>
      <div className="admin-page-pad">
        <div className="mx-auto max-w-full">
          <WorkerNavigationGuide />
        </div>
      </div>
      <UserManager />
    </>
  )
}
