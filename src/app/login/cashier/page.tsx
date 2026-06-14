import Link from "next/link"
import { LoginForm } from "@/components/auth/LoginForm"

const NAVY = "#001E62"

export default function CashierLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <Link
        href="/"
        className="mb-8 text-sm font-medium hover:underline"
        style={{ color: NAVY }}
      >
        &larr; Back to portal selection
      </Link>
      <LoginForm role="cashier" redirectTo="/scan" />
      <Link
        href="/scan"
        className="mt-6 text-sm font-medium hover:underline"
        style={{ color: NAVY }}
      >
        Skip to scan station (demo)
      </Link>
    </div>
  )
}
