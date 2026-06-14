"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, HelpCircle, Lock, User } from "lucide-react"
import { useAuth, type PortalRole } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"

const NAVY = "#001E62"

interface LoginFormProps {
  role: Exclude<PortalRole, null>
  redirectTo: string
}

export function LoginForm({ role, redirectTo }: LoginFormProps) {
  const router = useRouter()
  const { login, user } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user?.role === role) {
      router.replace(redirectTo)
    }
  }, [user, role, redirectTo, router])

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const result = login(username, password, role)
    if (!result.success) {
      setError(result.error ?? "Sign in failed.")
      return
    }
    router.push(redirectTo)
  }

  return (
    <div className="w-full max-w-lg rounded-[20px] border border-[#C8CDD7]/60 bg-white p-8 shadow-lg shadow-[#001E62]/5">
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${NAVY}15` }}
        >
          <Lock className="h-6 w-6" style={{ color: NAVY }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          Welcome Back
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Sign in to continue to the Madonna Nutrition Management System
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-5">
        <div>
          <Label htmlFor="username" className="text-sm font-semibold" style={{ color: NAVY }}>
            Username
          </Label>
          <div className="relative mt-2">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
            <Input
              id="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="h-14 pl-12 text-base"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-semibold" style={{ color: NAVY }}>
            Password
          </Label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="h-14 pl-12 pr-12 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#001E62]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
          <button type="button" className="font-medium hover:underline" style={{ color: NAVY }}>
            Forgot Password?
          </button>
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <Button type="submit" size="lg" className="h-14 w-full text-base">
          Sign In
        </Button>
      </form>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-[#64748B]">
        <HelpCircle className="h-4 w-4 shrink-0" />
        Need help? Contact your system administrator.
      </p>
    </div>
  )
}
