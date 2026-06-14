"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useDemo } from "@/components/providers/DemoProvider"
import { formatUserName } from "@/lib/users"
import type { UserRole } from "@/lib/types"

export type PortalRole = "cashier" | "parent" | "admin" | null

interface AuthUser {
  id: string
  username: string
  role: Exclude<PortalRole, null>
  displayName: string
  email: string
}

export interface LoginResult {
  success: boolean
  error?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (
    username: string,
    password: string,
    role: Exclude<PortalRole, null>
  ) => LoginResult
  logout: () => void
}

const STORAGE_KEY = "mnms-demo-session"

/**
 * Demo credentials (Clerk-ready structure — replace with Clerk signIn later):
 * - Match by username or email against demo users in DemoProvider
 * - Aliases: admin → d.garcia, parent → sarah.anderson, cashier → j.wilson
 * - Disabled accounts are blocked at login
 */
const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function writeSession(user: AuthUser | null) {
  if (typeof window === "undefined") return
  if (user) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

function portalMatchesUserRole(
  portalRole: Exclude<PortalRole, null>,
  userRole: UserRole
): boolean {
  if (portalRole === "admin") return userRole === "admin"
  if (portalRole === "cashier") return userRole === "cashier"
  if (portalRole === "parent") return userRole === "parent"
  return false
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { getUserByUsername, recordUserLogin, users } = useDemo()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = readSession()
    if (session) {
      const live = users.find((u) => u.id === session.id)
      if (live?.status === "disabled") {
        writeSession(null)
        setUser(null)
      } else {
        setUser(session)
      }
    }
    setIsLoading(false)
  }, [users])

  const login = useCallback(
    (
      username: string,
      _password: string,
      role: Exclude<PortalRole, null>
    ): LoginResult => {
      const trimmed = username.trim()
      if (!trimmed) {
        return { success: false, error: "Please enter a username." }
      }

      const demoUser = getUserByUsername(trimmed)
      if (!demoUser) {
        return {
          success: false,
          error: "No account found with that username. Try admin, parent, or j.wilson.",
        }
      }

      if (demoUser.status === "disabled") {
        return {
          success: false,
          error: "Account disabled. Contact your system administrator.",
        }
      }

      if (!portalMatchesUserRole(role, demoUser.role)) {
        return {
          success: false,
          error: `This account is registered as ${demoUser.role}. Use the correct portal to sign in.`,
        }
      }

      const session: AuthUser = {
        id: demoUser.id,
        username: demoUser.username,
        role,
        displayName: formatUserName(demoUser),
        email: demoUser.email,
      }

      setUser(session)
      writeSession(session)
      recordUserLogin(demoUser.id)
      return { success: true }
    },
    [getUserByUsername, recordUserLogin]
  )

  const logout = useCallback(() => {
    setUser(null)
    writeSession(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
