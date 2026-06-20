import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"
import { TEACHER_NAVY } from "@/config/teacher-theme"

export default function TeacherLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-sm font-medium hover:underline"
        style={{ color: TEACHER_NAVY }}
      >
        &larr; Back to portal selection
      </Link>
      <LoginForm role="teacher" redirectTo="/teacher" />
      <p className="mt-6 max-w-md text-center text-sm text-silver-foreground">
        Teacher accounts must use an approved school email (e.g. @weirtonmadonna.org).
      </p>
    </div>
  )
}
