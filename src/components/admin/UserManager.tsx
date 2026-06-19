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

const ROLES: UserRole[] = ["admin", "cashier", "parent", "staff", "teacher"]

function UserAvatar({ user }: { user: User }) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
      {initials}
    </div>
  )
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
  passwordMode: "generate" | "custom"
  password: string
  forcePasswordChange: boolean
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
  passwordMode: "generate",
  password: "",
  forcePasswordChange: true,
})

function ActionsMenu({
  user,
  onEdit,
  onReset,
  onChangeRole,
  onToggleStatus,
  onDelete,
}: {
  user: User
  onEdit: () => void
  onReset: () => void
  onChangeRole: () => void
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
            onClick={() => { setOpen(false); onChangeRole() }}
          >
            Change role
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
    updateUserRole,
    disableUser,
    enableUser,
    resetUserPassword,
    deleteUser,
  } = useDemo()

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [mode, setMode] = useState<
    "add" | "edit" | "disable" | "enable" | "delete" | "reset" | "change-role" | null
  >(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null)
  const [roleChangeAfterEdit, setRoleChangeAfterEdit] = useState(false)
  const [form, setForm] = useState<UserFormState>(emptyForm())
  const [resetForm, setResetForm] = useState({
    passwordMode: "generate" as "generate" | "custom",
    password: "",
    forcePasswordChange: true,
    reason: "",
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const performedBy = authUser?.displayName ?? "System Admin"
  const adminUserId = authUser?.id ?? ""

  if (authUser && authUser.role !== "admin") {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <p className="px-6 pb-6 text-sm text-silver-foreground">
            User management is restricted to administrators.
          </p>
        </Card>
      </div>
    )
  }

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
      passwordMode: "generate",
      password: "",
      forcePasswordChange: true,
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
    setResetForm({
      passwordMode: "generate",
      password: "",
      forcePasswordChange: true,
      reason: "",
    })
    setMode("reset")
  }

  function openDelete(user: User) {
    setSelected(user)
    setForm((f) => ({ ...f, reason: "" }))
    setMode("delete")
  }

  function promptRoleChange(user: User, role: UserRole, afterEdit = false) {
    if (role === user.role) return
    setSelected(user)
    setPendingRole(role)
    setRoleChangeAfterEdit(afterEdit)
    setMode("change-role")
  }

  function openChangeRole(user: User) {
    setSelected(user)
    setPendingRole(user.role)
    setRoleChangeAfterEdit(false)
    setMode("change-role")
  }

  async function saveEditFields() {
    if (!selected) return
    await updateUser(
      selected.id,
      {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        badgeId: userRoleSupportsBadge(form.role) ? form.badgeId || undefined : undefined,
        linkedStudentIds: form.role === "parent" ? form.linkedStudentIds : undefined,
      },
      performedBy,
      form.reason
    )
  }

  async function handleConfirmRoleChange() {
    if (!selected || !pendingRole) return
    if (!adminUserId) {
      showToast("Admin session required to change roles.")
      return
    }
    if (pendingRole === selected.role) {
      setMode(roleChangeAfterEdit ? "edit" : null)
      setPendingRole(null)
      setRoleChangeAfterEdit(false)
      return
    }
    try {
      await updateUserRole(selected.id, pendingRole, performedBy, adminUserId)
      if (roleChangeAfterEdit) {
        await saveEditFields()
        setMode(null)
        showToast("Account updated and role change logged to audit trail.")
      } else {
        setMode(null)
        showToast(`Role changed to ${ROLE_LABELS[pendingRole]}.`)
      }
      setPendingRole(null)
      setRoleChangeAfterEdit(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Role change failed.")
      if (roleChangeAfterEdit) {
        setMode("edit")
      }
      setPendingRole(null)
      setRoleChangeAfterEdit(false)
    }
  }

  function cancelRoleChange() {
    const returnToEdit = roleChangeAfterEdit
    setPendingRole(null)
    setRoleChangeAfterEdit(false)
    setMode(returnToEdit ? "edit" : null)
  }

  async function handleSaveAdd() {
    if (!form.username || !form.email || !form.firstName || !form.lastName) {
      showToast("Please fill in all required fields.")
      return
    }
    if (form.passwordMode === "custom" && form.password.length < 8) {
      showToast("Custom password must be at least 8 characters.")
      return
    }
    const result = await createUser(
      {
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        phone: form.phone || undefined,
        badgeId: userRoleSupportsBadge(form.role) ? form.badgeId || undefined : undefined,
        linkedStudentIds: form.role === "parent" ? form.linkedStudentIds : undefined,
        password: form.passwordMode === "custom" ? form.password : undefined,
        generateTempPassword: form.passwordMode === "generate",
        forcePasswordChange: form.forcePasswordChange,
        adminUserId,
      },
      performedBy
    )
    if (result.tempPassword) {
      setSelected(result)
      setTempPassword(result.tempPassword)
      setMode("reset")
      showToast(`User ${form.firstName} ${form.lastName} created. Copy the temporary password below.`)
      return
    }
    setMode(null)
    showToast(`User ${form.firstName} ${form.lastName} created.`)
  }

  async function handleSaveEdit() {
    if (!selected) return
    if (!form.reason.trim()) {
      showToast("A reason note is required for account corrections.")
      return
    }
    if (form.role !== selected.role) {
      promptRoleChange(selected, form.role, true)
      return
    }
    await saveEditFields()
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
    if (resetForm.passwordMode === "custom" && resetForm.password.length < 8) {
      showToast("Custom password must be at least 8 characters.")
      return
    }
    const result = await resetUserPassword(selected.id, performedBy, {
      adminUserId,
      password: resetForm.passwordMode === "custom" ? resetForm.password : undefined,
      generateTempPassword: resetForm.passwordMode === "generate",
      forcePasswordChange: resetForm.forcePasswordChange,
      reason: resetForm.reason || undefined,
    })
    if (result) {
      if (result.tempPassword) {
        setTempPassword(result.tempPassword)
      }
      showToast(
        result.tempPassword
          ? "Password reset generated. Copy the temporary password below."
          : "Password updated successfully."
      )
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
                          <select
                            className="h-10 min-w-[120px] rounded-xl border border-silver/60 bg-white px-3 text-sm text-primary"
                            value={u.role}
                            aria-label={`Role for ${formatUserName(u)}`}
                            onChange={(e) => {
                              const role = e.target.value as UserRole
                              if (role !== u.role) promptRoleChange(u, role)
                            }}
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
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
                            onChangeRole={() => openChangeRole(u)}
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

                {mode === "add" && (
                  <div className="space-y-4 rounded-2xl border border-silver/60 p-4">
                    <p className="text-sm font-semibold text-primary">Initial Password</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={form.passwordMode === "generate" ? "default" : "outline"}
                        onClick={() => setForm({ ...form, passwordMode: "generate", password: "" })}
                      >
                        Generate temporary
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={form.passwordMode === "custom" ? "default" : "outline"}
                        onClick={() => setForm({ ...form, passwordMode: "custom" })}
                      >
                        Set custom password
                      </Button>
                    </div>
                    {form.passwordMode === "custom" && (
                      <div>
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Minimum 8 characters"
                        />
                      </div>
                    )}
                    <label className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={form.forcePasswordChange}
                        onCheckedChange={(checked) =>
                          setForm({ ...form, forcePasswordChange: checked === true })
                        }
                      />
                      <span className="text-sm text-silver-foreground">
                        Require password change on next login
                      </span>
                    </label>
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
                  Reset password for{" "}
                  <strong className="text-primary">{formatUserName(selected)}</strong>.
                  All resets are recorded in the audit log.
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
                      Share this password securely with the user.
                    </p>
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
                        <Label>New Password</Label>
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
                        placeholder="e.g. User forgot password..."
                        rows={2}
                      />
                    </div>
                    <Button onClick={handleResetPassword}>
                      {resetForm.passwordMode === "generate" ? "Generate Password" : "Set Password"}
                    </Button>
                  </>
                )}
                <Button variant="outline" className="w-full" onClick={() => setMode(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {mode === "change-role" && selected && pendingRole && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/20 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Confirm Role Change</CardTitle>
              </CardHeader>
              <div className="space-y-4 px-6 pb-6">
                <p className="text-sm text-silver-foreground">
                  Change role for{" "}
                  <strong className="text-primary">{formatUserName(selected)}</strong> from{" "}
                  <strong className="text-primary">{ROLE_LABELS[selected.role]}</strong> to{" "}
                  <strong className="text-primary">{ROLE_LABELS[pendingRole]}</strong>?
                </p>
                {!roleChangeAfterEdit && (
                  <div>
                    <Label>New Role</Label>
                    <select
                      className="flex h-14 w-full rounded-2xl border-2 border-silver bg-white px-4 text-sm text-primary"
                      value={pendingRole}
                      onChange={(e) => setPendingRole(e.target.value as UserRole)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-xs text-silver-foreground">
                  This action is audit logged. The last active administrator cannot be demoted.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleConfirmRoleChange}
                    disabled={pendingRole === selected.role}
                  >
                    Confirm Role Change
                  </Button>
                  <Button variant="outline" onClick={cancelRoleChange}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
