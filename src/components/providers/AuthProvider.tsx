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

export type PortalRole = "cashier" | "parent" | "admin" | null

interface AuthUser {
  username: string
  role: PortalRole
  displayName: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (username: string, password: string, role: Exclude<PortalRole, null>) => boolean
  logout: () => void
}

const STORAGE_KEY = "mnms-demo-session"

/**
 * Demo credentials (Clerk-ready structure — replace with Clerk signIn later):
 * - Any username + password works for parent or admin login
 * - Optional explicit demo: parent / demo123 or admin / demo123
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(readSession())
    setIsLoading(false)
  }, [])

  const login = useCallback(
    (username: string, _password: string, role: Exclude<PortalRole, null>): boolean => {
      const trimmed = username.trim()
      if (!trimmed) return false

      const displayNames: Record<Exclude<PortalRole, null>, string> = {
        cashier: "Cashier",
        parent: "Sarah Anderson",
        admin: "Admin User",
      }

      const emails: Record<Exclude<PortalRole, null>, string> = {
        cashier: `${trimmed.toLowerCase().replace(/\s+/g, ".")}@madonnahs.org`,
        parent: "sarah.anderson@email.com",
        admin: `${trimmed.toLowerCase().replace(/\s+/g, ".")}@madonnahs.org`,
      }

      const session: AuthUser = {
        username: trimmed,
        role,
        displayName: displayNames[role],
        email: emails[role],
      }

      setUser(session)
      writeSession(session)
      return true
    },
    []
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
