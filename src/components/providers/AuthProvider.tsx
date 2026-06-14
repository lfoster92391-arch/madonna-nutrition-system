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
  ) => LoginResult | Promise<LoginResult>
  logout: () => void
}

const STORAGE_KEY = "mnms-demo-session"

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
  const { databaseEnabled, getUserByUsername, recordUserLogin, users, isLoading: dataLoading } =
    useDemo()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (dataLoading) return
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
  }, [users, dataLoading])

  const login = useCallback(
    async (
      username: string,
      password: string,
      role: Exclude<PortalRole, null>
    ): Promise<LoginResult> => {
      const trimmed = username.trim()
      if (!trimmed) {
        return { success: false, error: "Please enter a username." }
      }

      if (databaseEnabled) {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: trimmed, password, role }),
          })
          const raw = await res.text()
          let data: { success?: boolean; error?: string; user?: AuthUser }
          try {
            data = raw ? (JSON.parse(raw) as typeof data) : {}
          } catch {
            return {
              success: false,
              error:
                res.status >= 500
                  ? "Authentication service is unavailable. Check server database configuration."
                  : "Unable to reach authentication service.",
            }
          }
          const authUser = data.user
          if (!res.ok || !data.success || !authUser) {
            return {
              success: false,
              error: data.error ?? (res.status >= 500 ? "Authentication service is unavailable." : "Login failed."),
            }
          }

          const session: AuthUser = {
            id: authUser.id,
            username: authUser.username,
            role: authUser.role,
            displayName: authUser.displayName,
            email: authUser.email,
          }

          setUser(session)
          writeSession(session)
          await recordUserLogin(authUser.id)
          return { success: true }
        } catch {
          return { success: false, error: "Unable to reach authentication service." }
        }
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
      await recordUserLogin(demoUser.id)
      return { success: true }
    },
    [databaseEnabled, getUserByUsername, recordUserLogin]
  )

  const logout = useCallback(() => {
    setUser(null)
    writeSession(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading: isLoading || dataLoading, login, logout }),
    [user, isLoading, dataLoading, login, logout]
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
