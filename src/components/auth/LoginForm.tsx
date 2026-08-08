"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, HelpCircle, Lock, User } from "lucide-react"
import Image from "next/image"
import { useAuth, type PortalRole } from "@/components/providers/AuthProvider"
import { BRAND } from "@/config/brand"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const NAVY = "#001E62"

const PORTAL_LABELS: Record<Exclude<PortalRole, null>, string> = {
  parent: "Parent Portal",
  teacher: "Teacher Portal",
  staff: "Staff Portal",
  admin: "Admin Portal",
  cashier: "Scanner / Kiosk",
}

interface LoginFormProps {
  role: Exclude<PortalRole, null>
  redirectTo: string
  /** Compact form for landing access blocks (no outer card / logo). */
  variant?: "page" | "embedded"
}

export function LoginForm({ role, redirectTo, variant = "page" }: LoginFormProps) {
  const router = useRouter()
  const { login, user } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const embedded = variant === "embedded"

  useEffect(() => {
    if (user?.role === role) {
      if (role === "parent" && user.needsStudentLink) {
        router.replace("/login/parent/link")
        return
      }
      router.replace(redirectTo)
    }
  }, [user, role, redirectTo, router])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const result = await login(username, password, role)
      if (!result.success) {
        setError(result.error ?? "Sign in failed.")
        return
      }
      if (role === "parent" && result.needsStudentLink) {
        router.push("/login/parent/link")
        return
      }
      router.push(redirectTo)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "w-full",
        embedded
          ? "max-w-none text-left"
          : "max-w-lg rounded-[20px] border border-[#C8CDD7]/60 bg-white p-8 shadow-lg shadow-[#001E62]/5"
      )}
    >
      {!embedded && (
        <div className="mb-6 text-center">
          <Image
            src="/brand-logo.png"
            alt={BRAND.productName}
            width={160}
            height={42}
            priority
            className="mx-auto mb-4 h-10 w-auto object-contain"
          />
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Sign in to the {PORTAL_LABELS[role]}
          </p>
        </div>
      )}

      {embedded && (
        <p className="mb-3 text-sm font-semibold" style={{ color: NAVY }}>
          Sign in to {PORTAL_LABELS[role]}
        </p>
      )}

      <form onSubmit={handleSignIn} className={cn(embedded ? "space-y-3.5" : "space-y-5")}>
        <div>
          <Label
            htmlFor={`username-${role}-${variant}`}
            className="text-sm font-semibold"
            style={{ color: NAVY }}
          >
            Username or email
          </Label>
          <div className={cn("relative", embedded ? "mt-1.5" : "mt-2")}>
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] sm:left-4 sm:h-5 sm:w-5" />
            <Input
              id={`username-${role}-${variant}`}
              autoFocus={embedded}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              autoComplete="username"
              className={cn(embedded ? "h-11 pl-10 text-sm sm:pl-11" : "h-14 pl-12 text-base")}
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor={`password-${role}-${variant}`}
            className="text-sm font-semibold"
            style={{ color: NAVY }}
          >
            Password
          </Label>
          <div className={cn("relative", embedded ? "mt-1.5" : "mt-2")}>
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] sm:left-4 sm:h-5 sm:w-5" />
            <Input
              id={`password-${role}-${variant}`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={cn(embedded ? "h-11 pl-10 pr-10 text-sm sm:pl-11" : "h-14 pl-12 pr-12 text-base")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#001E62] sm:right-4"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2" style={{ color: NAVY }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[#C8CDD7] accent-[#001E62]"
            />
            Remember me
          </label>
          {!embedded && (
            <button type="button" className="font-medium hover:underline" style={{ color: NAVY }}>
              Forgot Password?
            </button>
          )}
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className={cn(embedded ? "h-11 w-full text-sm" : "h-14 w-full text-base")}
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      {!embedded && (
        <>
          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-[#64748B]">
            <HelpCircle className="h-4 w-4 shrink-0" />
            Need help? Contact your system administrator.
          </p>

          {role === "parent" && (
            <p className="mt-4 text-center text-sm text-[#64748B]">
              New here?{" "}
              <a href="/login/parent/register" className="font-semibold hover:underline" style={{ color: NAVY }}>
                Create a parent account
              </a>
            </p>
          )}
          {role === "staff" && (
            <p className="mt-4 text-center text-sm text-[#64748B]">
              New here?{" "}
              <a href="/login/staff/register" className="font-semibold hover:underline" style={{ color: NAVY }}>
                Create a staff account
              </a>
            </p>
          )}
          {role === "teacher" && (
            <p className="mt-4 text-center text-sm text-[#64748B]">
              New here?{" "}
              <a href="/login/teacher/register" className="font-semibold hover:underline" style={{ color: NAVY }}>
                Create a teacher account
              </a>
            </p>
          )}
        </>
      )}
    </div>
  )
}
