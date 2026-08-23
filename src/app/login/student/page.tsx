import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"

const NAVY = "#001E62"

export default function StudentLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <Link
        href="/access/school"
        className="mb-8 text-sm font-medium hover:underline"
        style={{ color: NAVY }}
      >
        &larr; Back to School Access
      </Link>
      <LoginForm role="student" redirectTo="/student" />
      <p className="mt-6 max-w-sm text-center text-sm text-[#64748B]">
        Sign in with your MD ID or school email. You can only order lunch for yourself — parents
        manage funds and photos in the Parent Portal.
      </p>
    </div>
  )
}
