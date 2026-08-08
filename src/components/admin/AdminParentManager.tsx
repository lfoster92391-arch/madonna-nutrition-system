"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, KeyRound, Search, Users } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input, Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatUserName } from "@/lib/users"
import type { User } from "@/lib/types"

function ParentAvatar({ user }: { user: User }) {
  if (user.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photo}
        alt={formatUserName(user)}
        className="h-12 w-12 shrink-0 rounded-xl object-cover"
      />
    )
  }
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
      {initials}
    </div>
  )
}

export function AdminParentManager() {
  const { users, students, resetUserPassword, databaseEnabled } = useDemo()
  const { user: authUser } = useAuth()
  const [search, setSearch] = useState("")
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetForm, setResetForm] = useState({
    passwordMode: "generate" as "generate" | "custom",
    password: "",
    forcePasswordChange: true,
    reason: "",
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const performedBy = authUser?.displayName ?? authUser?.username ?? "System Admin"
  const adminUserId = authUser?.id ?? ""

  const studentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const student of students) {
      map.set(student.id, `${student.firstName} ${student.lastName}`)
    }
    return map
  }, [students])

  const parentUsers = useMemo(
    () => users.filter((u) => u.role === "parent"),
    [users]
  )

  const filtered = useMemo(() => {
    return parentUsers.filter((u) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const linkedLabels = (u.linkedStudentIds ?? [])
        .map((id) => studentNameById.get(id) ?? id)
        .join(" ")
        .toLowerCase()
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        linkedLabels.includes(q)
      )
    })
  }, [parentUsers, search, studentNameById])

  function linkedStudentLabels(user: User): string {
    const ids = user.linkedStudentIds ?? []
    if (ids.length === 0) return "None linked"
    return ids.map((id) => studentNameById.get(id) ?? id).join(", ")
  }

  function openReset(user: User) {
    setResetTarget(user)
    setTempPassword(null)
    setCopied(false)
    setMessage(null)
    setResetForm({
      passwordMode: "generate",
      password: "",
      forcePasswordChange: true,
      reason: "",
    })
  }

  function closeReset() {
    setResetTarget(null)
    setTempPassword(null)
    setCopied(false)
    setMessage(null)
  }

  async function handleResetPassword() {
    if (!resetTarget) return
    if (!databaseEnabled) {
      setMessage("Connect the database to reset passwords.")
      return
    }
    if (!adminUserId) {
      setMessage("Admin session required. Sign out and sign in again.")
      return
    }
    if (resetForm.passwordMode === "custom" && resetForm.password.length < 8) {
      setMessage("Custom password must be at least 8 characters.")
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const result = await resetUserPassword(resetTarget.id, performedBy, {
        adminUserId,
        password: resetForm.passwordMode === "custom" ? resetForm.password : undefined,
        generateTempPassword: resetForm.passwordMode === "generate",
        forcePasswordChange: resetForm.forcePasswordChange,
        reason: resetForm.reason || undefined,
      })
      if (result?.tempPassword) {
        setTempPassword(result.tempPassword)
        setMessage("Password reset. Copy the temporary password below and share it securely.")
      } else {
        setMessage("Password updated. The parent can sign in with the new password.")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed.")
    } finally {
      setSaving(false)
    }
  }

  async function copyPassword() {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Parent accounts</h2>
          <p className="text-sm text-silver-foreground">
            Self-registered and imported parents appear here with their linked students. Use{" "}
            <strong>Reset password</strong> if a parent is locked out.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/users">All user accounts</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Parent accounts ({filtered.length})
          </CardTitle>
        </CardHeader>
        <div className="mb-4 px-3 sm:px-6">
          <div className="relative w-full min-w-0 sm:max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-silver-foreground" />
            <Input
              className="pl-12"
              placeholder="Search by name, email, or student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="mobile-scroll-x px-3 pb-6 sm:px-6">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-silver/60 text-silver-foreground">
                <th className="pb-3 pr-4 text-left font-medium">Photo</th>
                <th className="pb-3 pr-4 text-left font-medium">Name</th>
                <th className="pb-3 pr-4 text-left font-medium">Email</th>
                <th className="pb-3 pr-4 text-left font-medium">Linked students</th>
                <th className="pb-3 pr-4 text-left font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-silver-foreground">
                    <p className="text-base font-medium text-primary">No parent accounts yet</p>
                    <p className="mt-1">
                      Parents who create an account and link students will show up here. You can also
                      import families below.
                    </p>
                  </td>
                </tr>
              ) : null}
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-silver/30 ${u.status === "disabled" ? "opacity-60" : ""}`}
                >
                  <td className="py-3 pr-4">
                    <ParentAvatar user={u} />
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-primary">{formatUserName(u)}</p>
                    <p className="text-xs text-silver-foreground">@{u.username}</p>
                  </td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4 text-silver-foreground">{linkedStudentLabels(u)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={u.status === "active" ? "success" : "danger"}>{u.status}</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openReset(u)}>
                      <KeyRound className="h-4 w-4" />
                      Reset password
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset password</CardTitle>
            </CardHeader>
            <div className="space-y-4 px-6 pb-6">
              <p className="text-sm text-silver-foreground">
                Reset password for{" "}
                <strong className="text-primary">{formatUserName(resetTarget)}</strong>. Share a
                temporary password securely, or set a custom one and require a change on next login.
              </p>

              {message && (
                <p className="rounded-xl border border-silver/40 bg-silver/10 px-3 py-2 text-sm text-primary">
                  {message}
                </p>
              )}

              {tempPassword ? (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-warning">
                    Temporary password
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-xl bg-white px-4 py-3 font-mono text-sm text-primary">
                      {tempPassword}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => void copyPassword()}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={resetForm.passwordMode === "generate" ? "default" : "outline"}
                      onClick={() =>
                        setResetForm({ ...resetForm, passwordMode: "generate", password: "" })
                      }
                    >
                      Generate temporary
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={resetForm.passwordMode === "custom" ? "default" : "outline"}
                      onClick={() => setResetForm({ ...resetForm, passwordMode: "custom" })}
                    >
                      Set custom password
                    </Button>
                  </div>
                  {resetForm.passwordMode === "custom" && (
                    <div>
                      <Label>New password</Label>
                      <Input
                        type="password"
                        value={resetForm.password}
                        onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                      checked={resetForm.forcePasswordChange}
                      onCheckedChange={(checked) =>
                        setResetForm({ ...resetForm, forcePasswordChange: checked === true })
                      }
                    />
                    <span className="text-sm text-silver-foreground">
                      Require password change on next login
                    </span>
                  </label>
                  <div>
                    <Label>Reason (optional)</Label>
                    <Textarea
                      value={resetForm.reason}
                      onChange={(e) => setResetForm({ ...resetForm, reason: e.target.value })}
                      placeholder="e.g. Parent forgot password…"
                      rows={2}
                    />
                  </div>
                  <Button onClick={() => void handleResetPassword()} disabled={saving}>
                    {saving
                      ? "Resetting…"
                      : resetForm.passwordMode === "generate"
                        ? "Reset password"
                        : "Set password"}
                  </Button>
                </>
              )}

              <Button variant="outline" className="w-full" onClick={closeReset}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
