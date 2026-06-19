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
import { demoUsers } from "@/data/demo"
import { isAllowedTeacherEmail, TEACHER_ACCESS_DENIED_MESSAGE } from "@/config/teacher-auth"
import { isDemoPreviewActive, writeDemoPreview } from "@/lib/demo/session"
import { formatUserName, findUserByLogin } from "@/lib/users"
import type { UserRole } from "@/lib/types"

export type PortalRole = "cashier" | "parent" | "admin" | "teacher" | null

interface AuthUser {
  id: string
  username: string
  role: Exclude<PortalRole, null>
  displayName: string
  email: string
  mustChangePassword?: boolean
}

export interface LoginResult {
  success: boolean
  error?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  mustChangePassword: boolean
  clearMustChangePassword: () => void
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
  if (portalRole === "teacher") return userRole === "teacher"
  return false
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { databaseEnabled, getUserByUsername, recordUserLogin, users, isLoading: dataLoading } =
    useDemo()
  const authUsers = databaseEnabled ? users : demoUsers
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    if (dataLoading) return
    const session = readSession()
    if (session) {
      let live = authUsers.find((u) => u.id === session.id)
      if (!live) {
        const username = session.username.toLowerCase()
        const email = session.email.toLowerCase()
        live = authUsers.find(
          (u) => u.username.toLowerCase() === username || u.email.toLowerCase() === email
        )
      }

      if (live?.status === "disabled") {
        writeSession(null)
        setUser(null)
      } else if (live) {
        const reconciled: AuthUser = {
          id: live.id,
          username: live.username,
          role: session.role,
          displayName: formatUserName(live),
          email: live.email,
          mustChangePassword: live.mustChangePassword ?? session.mustChangePassword,
        }
        setUser(reconciled)
        setMustChangePassword(Boolean(reconciled.mustChangePassword))
        if (reconciled.id !== session.id) {
          writeSession(reconciled)
        }
      } else {
        setUser(session)
      }
    }
    setIsLoading(false)
  }, [authUsers, dataLoading])

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

      if (databaseEnabled && !isDemoPreviewActive()) {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: trimmed, password, role }),
          })
          const raw = await res.text()
          let data: {
            success?: boolean
            error?: string
            mustChangePassword?: boolean
            user?: AuthUser
          }
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
            mustChangePassword: data.mustChangePassword,
          }

          setUser(session)
          setMustChangePassword(Boolean(data.mustChangePassword))
          writeSession(session)
          await recordUserLogin(authUser.id)
          return { success: true }
        } catch {
          return { success: false, error: "Unable to reach authentication service." }
        }
      }

      const demoUser = findUserByLogin(demoUsers, trimmed)
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

      if (role === "teacher" && !isAllowedTeacherEmail(demoUser.email)) {
        return { success: false, error: TEACHER_ACCESS_DENIED_MESSAGE }
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
    setMustChangePassword(false)
    writeSession(null)
    writeDemoPreview(false)
  }, [])

  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false)
    setUser((current) => {
      if (!current) return current
      const next = { ...current, mustChangePassword: false }
      writeSession(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading: isLoading || dataLoading,
      mustChangePassword,
      clearMustChangePassword,
      login,
      logout,
    }),
    [user, isLoading, dataLoading, mustChangePassword, clearMustChangePassword, login, logout]
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
