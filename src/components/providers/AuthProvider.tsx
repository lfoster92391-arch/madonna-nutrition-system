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
import { clearLegacySessionCaches } from "@/lib/demo/session"
import { formatUserName, normalizeUsername } from "@/lib/users"

export type PortalRole = "cashier" | "parent" | "admin" | "staff" | "teacher" | "student" | null

interface AuthUser {
  id: string
  username: string
  role: Exclude<PortalRole, null>
  displayName: string
  email: string
  mustChangePassword?: boolean
  needsStudentLink?: boolean
  linkedStudentIds?: string[]
  parentCapable?: boolean
}

export interface LoginResult {
  success: boolean
  error?: string
  needsStudentLink?: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  mustChangePassword: boolean
  clearMustChangePassword: () => void
  clearNeedsStudentLink: () => void
  appendLinkedStudentId: (studentExternalId: string) => void
  login: (
    username: string,
    password: string,
    role: Exclude<PortalRole, null>
  ) => LoginResult | Promise<LoginResult>
  logout: () => void
}

const STORAGE_KEY = "mnms-auth-session"

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

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { databaseEnabled, recordUserLogin, users, isLoading: dataLoading } = useDemo()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mustChangePassword, setMustChangePassword] = useState(false)

  useEffect(() => {
    if (dataLoading) return
    const session = readSession()
    if (session) {
      let live = users.find((u) => u.id === session.id)
      if (!live) {
        const username = normalizeUsername(session.username)
        const email = session.email.toLowerCase()
        live = users.find(
          (u) => normalizeUsername(u.username) === username || u.email.toLowerCase() === email
        )
      }

      if (live?.status === "disabled") {
        writeSession(null)
        setUser(null)
        setMustChangePassword(false)
      } else if (live) {
        const portalRole = live.role
        if (
          portalRole !== "admin" &&
          portalRole !== "cashier" &&
          portalRole !== "parent" &&
          portalRole !== "staff" &&
          portalRole !== "teacher" &&
          portalRole !== "student"
        ) {
          writeSession(null)
          setUser(null)
          setMustChangePassword(false)
        } else {
          const reconciled: AuthUser = {
            id: live.id,
            username: live.username,
            role: portalRole,
            displayName: formatUserName(live),
            email: live.email,
            mustChangePassword: live.mustChangePassword ?? false,
            linkedStudentIds: live.linkedStudentIds ?? session.linkedStudentIds ?? [],
            needsStudentLink: session.needsStudentLink,
            parentCapable:
              session.parentCapable || (live.linkedStudentIds ?? []).length > 0,
          }
          setUser(reconciled)
          setMustChangePassword(Boolean(reconciled.mustChangePassword))
          if (
            reconciled.id !== session.id ||
            reconciled.role !== session.role ||
            reconciled.mustChangePassword !== session.mustChangePassword
          ) {
            writeSession(reconciled)
          }
        }
      } else if (databaseEnabled && users.length > 0) {
        // User list loaded but session identity is gone — clear auth.
        writeSession(null)
        setUser(null)
        setMustChangePassword(false)
      } else {
        // Keep kiosk/cashier session if the users query is empty or still recovering.
        setUser(session)
        setMustChangePassword(Boolean(session.mustChangePassword))
      }
    }
    setIsLoading(false)
  }, [users, dataLoading, databaseEnabled])

  const login = useCallback(
    async (
      username: string,
      password: string,
      role: Exclude<PortalRole, null>
    ): Promise<LoginResult> => {
      const trimmed = username.trim()
      if (!trimmed) {
        return { success: false, error: "Please enter a username or email." }
      }

      if (!databaseEnabled) {
        return {
          success: false,
          error: "Authentication requires a configured database. Contact your system administrator.",
        }
      }

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
          needsStudentLink?: boolean
          user?: AuthUser & { linkedStudentIds?: string[]; parentCapable?: boolean }
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
            error:
              data.error ??
              (res.status >= 500
                ? "Authentication service is unavailable."
                : "Login failed."),
          }
        }

        const session: AuthUser = {
          id: authUser.id,
          username: authUser.username,
          role: authUser.role,
          displayName: authUser.displayName,
          email: authUser.email,
          mustChangePassword: data.mustChangePassword,
          needsStudentLink: Boolean(data.needsStudentLink),
          linkedStudentIds: authUser.linkedStudentIds ?? [],
          parentCapable: Boolean(authUser.parentCapable),
        }

        setUser(session)
        setMustChangePassword(Boolean(data.mustChangePassword))
        writeSession(session)
        await recordUserLogin(authUser.id)
        return { success: true, needsStudentLink: Boolean(data.needsStudentLink) }
      } catch {
        return { success: false, error: "Unable to reach authentication service." }
      }
    },
    [databaseEnabled, recordUserLogin]
  )

  const logout = useCallback(() => {
    setUser(null)
    setMustChangePassword(false)
    writeSession(null)
    clearLegacySessionCaches()
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

  const clearNeedsStudentLink = useCallback(() => {
    setUser((current) => {
      if (!current) return current
      const next = { ...current, needsStudentLink: false }
      writeSession(next)
      return next
    })
  }, [])

  const appendLinkedStudentId = useCallback((studentExternalId: string) => {
    const id = studentExternalId.trim()
    if (!id) return
    setUser((current) => {
      if (!current) return current
      const linkedStudentIds = [...new Set([...(current.linkedStudentIds ?? []), id])]
      const next = {
        ...current,
        linkedStudentIds,
        needsStudentLink: false,
        parentCapable: true,
      }
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
      clearNeedsStudentLink,
      appendLinkedStudentId,
      login,
      logout,
    }),
    [
      user,
      isLoading,
      dataLoading,
      mustChangePassword,
      clearMustChangePassword,
      clearNeedsStudentLink,
      appendLinkedStudentId,
      login,
      logout,
    ]
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
