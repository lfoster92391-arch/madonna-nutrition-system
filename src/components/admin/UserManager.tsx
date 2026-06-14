"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Check,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Plus,
  Search,
  UserX,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input, Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditLogTable } from "@/components/admin/AuditLogTable"
import { formatUserName, ROLE_LABELS, userRoleSupportsBadge } from "@/lib/users"
import type { User, UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROLES: UserRole[] = ["admin", "cashier", "parent", "staff"]

function UserAvatar({ user }: { user: User }) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
      {initials}
    </div>
  )
}

function roleBadgeVariant(role: UserRole): "default" | "success" | "warning" | "outline" {
  switch (role) {
    case "admin":
      return "default"
    case "cashier":
      return "warning"
    case "parent":
      return "success"
    default:
      return "outline"
  }
}

interface UserFormState {
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone: string
  badgeId: string
  linkedStudentIds: string[]
  reason: string
}

const emptyForm = (): UserFormState => ({
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  role: "cashier",
  phone: "",
  badgeId: "",
  linkedStudentIds: [],
  reason: "",
})

function ActionsMenu({
  user,
  onEdit,
  onReset,
  onToggleStatus,
  onDelete,
}: {
  user: User
  onEdit: () => void
  onReset: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
        aria-label="User actions"
      >
        <MoreHorizontal className="h-4 w-4" />
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 min-w-[180px] rounded-xl border border-silver/60 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm hover:bg-silver/20"
            onClick={() => { setOpen(false); onEdit() }}
          >
            Edit account
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm hover:bg-silver/20"
            onClick={() => { setOpen(false); onReset() }}
          >
            Reset password
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm hover:bg-silver/20"
            onClick={() => { setOpen(false); onToggleStatus() }}
          >
            {user.status === "active" ? "Disable account" : "Enable account"}
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-danger/10"
            onClick={() => { setOpen(false); onDelete() }}
          >
            Delete user
          </button>
        </div>
      )}
    </div>
  )
}

export function UserManager() {
  const { user: authUser } = useAuth()
  const {
    users,
    students,
    createUser,
    updateUser,
    disableUser,
    enableUser,
    resetUserPassword,
    deleteUser,
  } = useDemo()

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [mode, setMode] = useState<"add" | "edit" | "disable" | "enable" | "delete" | "reset" | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm())
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const performedBy = authUser?.displayName ?? "System Admin"

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.badgeId?.includes(q) ?? false)
      )
    })
  }, [users, search, roleFilter])

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  function openAdd() {
    setSelected(null)
    setForm(emptyForm())
    setMode("add")
  }

  function openEdit(user: User) {
    setSelected(user)
    setForm({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone ?? "",
      badgeId: user.badgeId ?? "",
      linkedStudentIds: user.linkedStudentIds ?? [],
      reason: "",
    })
    setMode("edit")
  }

  function openToggleStatus(user: User) {
    setSelected(user)
    setForm((f) => ({ ...f, reason: "" }))
    setMode(user.status === "active" ? "disable" : "enable")
  }

  function openReset(user: User) {
    setSelected(user)
    setTempPassword(null)
    setCopied(false)
    setMode("reset")
  }

  function openDelete(user: User) {
    setSelected(user)
    setForm((f) => ({ ...f, reason: "" }))
    setMode("delete")
  }

  async function handleSaveAdd() {
    if (!form.username || !form.email || !form.firstName || !form.lastName) {
      showToast("Please fill in all required fields.")
      return
    }
    await createUser(
      {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        phone: form.phone || undefined,
        badgeId: userRoleSupportsBadge(form.role) ? form.badgeId || undefined : undefined,
        linkedStudentIds: form.role === "parent" ? form.linkedStudentIds : undefined,
      },
      performedBy
    )
    setMode(null)
    showToast(`User ${form.firstName} ${form.lastName} created.`)
  }

  async function handleSaveEdit() {
    if (!selected) return
    if (!form.reason.trim()) {
      showToast("A reason note is required for account corrections.")
      return
    }
    await updateUser(
      selected.id,
      {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        phone: form.phone || undefined,
        badgeId: userRoleSupportsBadge(form.role) ? form.badgeId || undefined : undefined,
        linkedStudentIds: form.role === "parent" ? form.linkedStudentIds : undefined,
      },
      performedBy,
      form.reason
    )
    setMode(null)
    showToast("Account updated and logged to audit trail.")
  }

  async function handleConfirmEnable() {
    if (!selected) return
    await enableUser(selected.id, performedBy, form.reason || "Re-enabled by administrator")
    setMode(null)
    showToast(`${formatUserName(selected)} has been enabled.`)
  }

  async function handleConfirmDisable() {
    if (!selected || !form.reason.trim()) {
      showToast("Please provide a reason for disabling this account.")
      return
    }
    await disableUser(selected.id, performedBy, form.reason)
    setMode(null)
    showToast(`${formatUserName(selected)} has been disabled.`)
  }

  async function handleConfirmDelete() {
    if (!selected || !form.reason.trim()) {
      showToast("Please provide a reason for deleting this account.")
      return
    }
    await deleteUser(selected.id, performedBy, form.reason)
    setMode(null)
    showToast("User deleted and recorded in audit log.")
  }

  async function handleResetPassword() {
    if (!selected) return
    const result = await resetUserPassword(selected.id, performedBy)
    if (result) {
      setTempPassword(result.tempPassword)
      showToast("Password reset generated. Copy the temporary password below.")
    }
  }

  async function copyPassword() {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleStudentLink(studentId: string) {
    setForm((f) => ({
      ...f,
      linkedStudentIds: f.linkedStudentIds.includes(studentId)
        ? f.linkedStudentIds.filter((id) => id !== studentId)
        : [...f.linkedStudentIds, studentId],
    }))
  }

  function formatLastLogin(at?: string) {
    if (!at) return "Never"
    return new Date(at).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">User Management</h1>
            <p className="text-silver-foreground">
              Manage portal accounts, roles, and access — all changes are audit logged.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/audit-log">View Audit Log</Link>
            </Button>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {toast && (
          <div className="rounded-2xl border border-success/40 bg-success/10 px-6 py-4 font-medium text-success">
            {toast}
          </div>
        )}

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users ({filtered.length})</CardTitle>
              </CardHeader>
              <div className="mb-4 flex flex-wrap gap-4 px-6">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-silver-foreground" />
                  <Input
                    className="pl-12"
                    placeholder="Search by name, email, or username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={roleFilter === "all" ? "default" : "outline"}
                    onClick={() => setRoleFilter("all")}
                  >
                    All
                  </Button>
                  {ROLES.map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant={roleFilter === role ? "default" : "outline"}
                      onClick={() => setRoleFilter(role)}
                    >
                      {ROLE_LABELS[role]}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-silver/60 text-silver-foreground">
                      <th className="pb-3 pr-4 text-left font-medium">Photo</th>
                      <th className="pb-3 pr-4 text-left font-medium">Name</th>
                      <th className="pb-3 pr-4 text-left font-medium">Email</th>
                      <th className="pb-3 pr-4 text-left font-medium">Role</th>
                      <th className="pb-3 pr-4 text-left font-medium">Badge ID</th>
                      <th className="pb-3 pr-4 text-left font-medium">Status</th>
                      <th className="pb-3 pr-4 text-left font-medium">Last Login</th>
                      <th className="pb-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr
                        key={u.id}
                        className={cn(
                          "border-b border-silver/30",
                          u.status === "disabled" && "opacity-60"
                        )}
                      >
                        <td className="py-3 pr-4">
                          <UserAvatar user={u} />
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-primary">{formatUserName(u)}</p>
                          <p className="text-xs text-silver-foreground">@{u.username}</p>
                        </td>
                        <td className="py-3 pr-4">{u.email}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={roleBadgeVariant(u.role)}>{ROLE_LABELS[u.role]}</Badge>
                        </td>
                        <td className="py-3 pr-4 font-mono text-silver-foreground">
                          {userRoleSupportsBadge(u.role) ? (u.badgeId ?? "—") : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={u.status === "active" ? "success" : "danger"}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-silver-foreground">
                          {formatLastLogin(u.lastLoginAt)}
                        </td>
                        <td className="py-3 text-right">
                          <ActionsMenu
                            user={u}
                            onEdit={() => openEdit(u)}
                            onReset={() => openReset(u)}
                            onToggleStatus={() => openToggleStatus(u)}
                            onDelete={() => openDelete(u)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogTable filterUserActions showHeader={false} />
          </TabsContent>
        </Tabs>

        {(mode === "add" || mode === "edit") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4">
            <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
              <CardHeader>
                <CardTitle>{mode === "add" ? "Add User" : "Edit Account"}</CardTitle>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      className="flex h-14 w-full rounded-2xl border-2 border-silver bg-white px-4 text-sm text-primary"
                      value={form.role}
                      onChange={(e) => {
                        const role = e.target.value as UserRole
                        setForm({
                          ...form,
                          role,
                          badgeId: userRoleSupportsBadge(role) ? form.badgeId : "",
                        })
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {userRoleSupportsBadge(form.role) && (
                  <div>
                    <Label>Staff Badge ID</Label>
                    <Input
                      inputMode="numeric"
                      pattern="\d*"
                      placeholder="e.g. 90004 (4–6 digits)"
                      value={form.badgeId}
                      onChange={(e) =>
                        setForm({ ...form, badgeId: e.target.value.replace(/\D/g, "") })
                      }
                    />
                    <p className="mt-2 text-xs text-silver-foreground">
                      Used for cafeteria staff identification. Student badges use a separate ID range.
                    </p>
                  </div>
                )}

                {form.role === "parent" && (
                  <div>
                    <Label>Linked Students</Label>
                    <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-silver/60 p-4">
                      {students.map((s) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-3">
                          <Checkbox
                            checked={form.linkedStudentIds.includes(s.id)}
                            onCheckedChange={() => toggleStudentLink(s.id)}
                          />
                          <span className="text-sm">
                            {s.firstName} {s.lastName} ({s.id})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {mode === "edit" && (
                  <div>
                    <Label>Reason for correction (required)</Label>
                    <Textarea
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Describe why this account is being updated..."
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={mode === "add" ? handleSaveAdd : handleSaveEdit}>
                    {mode === "add" ? "Create User" : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {mode === "enable" && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Enable Account</CardTitle>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <p className="text-sm text-silver-foreground">
                  Re-enable <strong className="text-primary">{formatUserName(selected)}</strong>?
                  They will be able to sign in again.
                </p>
                <div>
                  <Label>Reason (optional)</Label>
                  <Textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="e.g. Returned from leave..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleConfirmEnable}>Enable Account</Button>
                  <Button variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {mode === "disable" && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-danger" />
                  Disable Account
                </CardTitle>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <p className="text-sm text-silver-foreground">
                  Disable <strong className="text-primary">{formatUserName(selected)}</strong>?
                  They will not be able to sign in until re-enabled.
                </p>
                <div>
                  <Label>Reason (required)</Label>
                  <Textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="e.g. Staff departure, policy violation..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="danger" onClick={handleConfirmDisable}>Disable Account</Button>
                  <Button variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {mode === "delete" && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Delete User</CardTitle>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <p className="text-sm text-silver-foreground">
                  Permanently delete <strong className="text-primary">{formatUserName(selected)}</strong>?
                  This action is recorded in the audit log.
                </p>
                <div>
                  <Label>Reason (required)</Label>
                  <Textarea
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="danger" onClick={handleConfirmDelete}>Delete User</Button>
                  <Button variant="outline" onClick={() => setMode(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {mode === "reset" && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <p className="text-sm text-silver-foreground">
                  Generate a temporary password for{" "}
                  <strong className="text-primary">{formatUserName(selected)}</strong>.
                  In production, this triggers Clerk password reset email.
                </p>
                {tempPassword ? (
                  <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-warning">Temporary Password</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-xl bg-white px-4 py-3 font-mono text-sm text-primary">
                        {tempPassword}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyPassword}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-silver-foreground">
                      Reset marked as sent — logged to audit trail.
                    </p>
                  </div>
                ) : (
                  <Button onClick={handleResetPassword}>Generate Temporary Password</Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => setMode(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
