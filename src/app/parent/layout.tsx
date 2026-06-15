import { ParentAuthGuard } from "@/components/auth/ParentAuthGuard"
import { ParentSidebar } from "@/components/layout/ParentSidebar"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParentAuthGuard>
      <div className="parent-portal flex min-h-screen bg-white">
        <ParentSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </ParentAuthGuard>
  )
}
