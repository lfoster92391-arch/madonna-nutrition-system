import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"
import { STAFF_NAVY } from "@/components/staff/layout/staff-theme"

export default function StaffLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-sm font-medium hover:underline"
        style={{ color: STAFF_NAVY }}
      >
        &larr; Back to portal selection
      </Link>
      <LoginForm role="staff" redirectTo="/staff" />
      <p className="mt-6 max-w-md text-center text-sm text-silver-foreground">
        Staff accounts are created by your administrator. Contact IT if you need access.
      </p>
    </div>
  )
}
