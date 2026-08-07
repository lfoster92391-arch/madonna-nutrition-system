"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { Camera, DollarSign, Pencil, Plus, Search, Upload, UserRound } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { useAuth } from "@/components/providers/AuthProvider"
import { RecordStaffOfficePayment } from "@/components/admin/RecordStaffOfficePayment"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { api } from "@/lib/api/client"
import { compressImageDataUrl } from "@/lib/images/compress-data-url"
import { formatCurrency } from "@/lib/utils"
import {
  formatUserName,
  isWorkplaceUserRole,
  ROLE_LABELS,
  userRoleSupportsBadge,
  WORKPLACE_USER_ROLES,
} from "@/lib/users"
import type { User, UserRole } from "@/lib/types"

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function StaffAvatar({ user, size = 48 }: { user: User; size?: number }) {
  if (user.photo) {
    return (
      <Image
        src={user.photo}
        alt={formatUserName(user)}
        width={size}
        height={size}
        className="rounded-xl object-cover"
        unoptimized={user.photo.startsWith("data:")}
      />
    )
  }
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}

export function AdminStaffManager({
  onImportClick,
}: {
  onImportClick?: () => void
}) {
  const { users, updateUser, createUser, databaseEnabled } = useDemo()
  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all")
  const [editing, setEditing] = useState<User | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    department: "",
    badgeId: "",
    role: "staff" as UserRole,
    reason: "",
  })
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const editFormRef = useRef<HTMLDivElement>(null)

  const staffUsers = useMemo(
    () => users.filter((u) => isWorkplaceUserRole(u.role)),
    [users]
  )

  const filtered = useMemo(() => {
    return staffUsers.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.department?.toLowerCase().includes(q) ?? false) ||
        (u.badgeId?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [staffUsers, search, roleFilter])

  const performedBy = authUser?.displayName ?? authUser?.username ?? "System Admin"
  const adminUserId = authUser?.id ?? ""

  function resetForm() {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phone: "",
      department: "",
      badgeId: "",
      role: "staff",
      reason: "",
    })
    setPendingPhoto(null)
    setPhotoMessage(null)
  }

  function openProfile(user: User) {
    setEditing(user)
    setShowAdd(false)
    setShowAddMoney(false)
    setMessage(null)
    setPendingPhoto(null)
    setPhotoMessage(null)
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      phone: user.phone ?? "",
      department: user.department ?? "",
      badgeId: user.badgeId ?? "",
      role: user.role,
      reason: "",
    })
    requestAnimationFrame(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function openAdd() {
    setEditing(null)
    setShowAdd(true)
    setMessage(null)
    resetForm()
    requestAnimationFrame(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function closeEditor() {
    setEditing(null)
    setShowAdd(false)
    setShowAddMoney(false)
    resetForm()
  }

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setMessage("First name, last name, and email are required.")
      return
    }
    if (!databaseEnabled) {
      setMessage("Connect the database to manage staff accounts.")
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      if (editing) {
        if (!form.reason.trim()) {
          setMessage("Add a short note explaining why you changed this profile.")
          setSaving(false)
          return
        }
        const updated = await updateUser(
          editing.id,
          {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            username: form.username.trim(),
            phone: form.phone.trim() || undefined,
            department: form.department.trim() || undefined,
            badgeId: userRoleSupportsBadge(editing.role)
              ? form.badgeId.trim() || undefined
              : undefined,
          },
          performedBy,
          form.reason.trim()
        )
        setEditing(updated)
        setMessage("Staff profile saved.")
        void queryClient.invalidateQueries({ queryKey: ["users"] })
      } else {
        if (!form.username.trim()) {
          setMessage("Username is required for a new staff account.")
          setSaving(false)
          return
        }
        if (!adminUserId) {
          setMessage("Admin session required. Sign out and sign in again.")
          setSaving(false)
          return
        }
        const created = await createUser(
          {
            username: form.username.trim(),
            email: form.email.trim(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            role: form.role,
            phone: form.phone.trim() || undefined,
            badgeId: userRoleSupportsBadge(form.role)
              ? form.badgeId.trim() || undefined
              : undefined,
            generateTempPassword: true,
            forcePasswordChange: true,
            adminUserId,
          },
          performedBy
        )
        if (form.department.trim()) {
          await updateUser(
            created.id,
            { department: form.department.trim() },
            performedBy,
            "Set department on new staff account"
          )
        }
        setShowAdd(false)
        openProfile(
          form.department.trim()
            ? { ...created, department: form.department.trim() }
            : created
        )
        setMessage(
          created.tempPassword
            ? `Account created. Temporary password: ${created.tempPassword}`
            : "Staff account created. Use Open profile to add a photo."
        )
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save staff profile.")
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !editing) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const compressed = await compressImageDataUrl(dataUrl)
      setPendingPhoto(compressed)
      setPhotoMessage("Preview ready. Tap Save photo to keep it on this profile.")
    } catch {
      setPhotoMessage("Could not read that image. Try another file.")
    }
  }

  async function handleSavePhoto() {
    if (!editing || !pendingPhoto) return
    setPhotoBusy(true)
    setPhotoMessage(null)
    try {
      const compressed = await compressImageDataUrl(pendingPhoto)
      const updated = await api.uploadUserPhoto(editing.id, compressed)
      setEditing({ ...updated, photo: compressed })
      setPendingPhoto(null)
      setPhotoMessage("Photo saved.")
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    } catch (error) {
      setPhotoMessage(
        error instanceof Error ? error.message : "Could not save the photo. Try a smaller image."
      )
    } finally {
      setPhotoBusy(false)
    }
  }

  function triggerPhotoUpload(mode: "camera" | "file") {
    const ref = mode === "camera" ? cameraInputRef : photoInputRef
    ref.current?.click()
  }

  const editingPhoto = pendingPhoto ?? editing?.photo

  return (
    <div className="space-y-6">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handlePhotoUpload(e)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => void handlePhotoUpload(e)}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Staff directory</h2>
          <p className="text-sm text-silver-foreground">
            After you import staff, they show up here. Tap <strong>Open profile</strong> to edit
            details or add a photo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {onImportClick && (
            <Button variant="outline" onClick={onImportClick}>
              <Upload className="h-4 w-4" />
              Import staff
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add staff
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/users">All user accounts</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Staff accounts ({filtered.length})
          </CardTitle>
        </CardHeader>
        <div className="mb-4 flex flex-wrap gap-3 px-3 sm:gap-4 sm:px-6">
          <div className="relative w-full min-w-0 flex-1 sm:min-w-[240px]">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-silver-foreground" />
            <Input
              className="pl-12"
              placeholder="Search by name, email, or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mobile-scroll-x flex max-w-full gap-2 pb-1">
            <Button
              size="sm"
              variant={roleFilter === "all" ? "default" : "outline"}
              onClick={() => setRoleFilter("all")}
              className="shrink-0"
            >
              All
            </Button>
            {WORKPLACE_USER_ROLES.map((role) => (
              <Button
                key={role}
                size="sm"
                variant={roleFilter === role ? "default" : "outline"}
                onClick={() => setRoleFilter(role)}
                className="shrink-0"
              >
                {ROLE_LABELS[role]}
              </Button>
            ))}
          </div>
        </div>
        <div className="mobile-scroll-x px-3 pb-6 sm:px-6">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-silver/60 text-silver-foreground">
                <th className="pb-3 pr-4 text-left font-medium">Photo</th>
                <th className="pb-3 pr-4 text-left font-medium">Name</th>
                <th className="pb-3 pr-4 text-left font-medium">Email</th>
                <th className="pb-3 pr-4 text-left font-medium">Role</th>
                <th className="pb-3 pr-4 text-left font-medium">Department</th>
                <th className="pb-3 pr-4 text-left font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-silver-foreground">
                    <p className="text-base font-medium text-primary">No staff yet</p>
                    <p className="mt-1">
                      Import a spreadsheet below, or tap <strong>Add staff</strong> to create one
                      account.
                    </p>
                    {onImportClick && (
                      <Button className="mt-4" onClick={onImportClick}>
                        Import staff
                      </Button>
                    )}
                  </td>
                </tr>
              ) : null}
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-silver/30 ${u.status === "disabled" ? "opacity-60" : ""}`}
                >
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => openProfile(u)}
                      className="group relative"
                      title="Open profile"
                      disabled={u.status === "disabled"}
                    >
                      <StaffAvatar user={u} />
                      <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/60 opacity-0 transition group-hover:opacity-100">
                        <Camera className="h-5 w-5 text-white" />
                      </span>
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-primary">{formatUserName(u)}</p>
                    <p className="text-xs text-silver-foreground">@{u.username}</p>
                  </td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="default">{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td className="py-3 pr-4">{u.department || "—"}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={u.status === "active" ? "success" : "danger"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          openProfile(u)
                          setShowAddMoney(true)
                        }}
                        disabled={u.status === "disabled"}
                        className="min-h-10 gap-1.5 font-semibold"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        Add Money
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openProfile(u)}
                        disabled={u.status === "disabled"}
                        className="min-h-10 gap-1.5 font-semibold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Open profile
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {(showAdd || editing) && (
        <div ref={editFormRef}>
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Staff profile" : "Add staff"}</CardTitle>
              {editing && (
                <p className="text-sm text-silver-foreground">
                  Update contact details and photo. Photos help identify staff on badges and in the
                  directory.
                </p>
              )}
            </CardHeader>
            <div className="grid gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>First name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Last name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
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
                <Label>Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={Boolean(editing)}
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
                <Label>Department</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
              {!editing && (
                <div>
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  >
                    {WORKPLACE_USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {userRoleSupportsBadge(editing?.role ?? form.role) && (
                <div>
                  <Label>Badge ID</Label>
                  <Input
                    value={form.badgeId}
                    onChange={(e) => setForm({ ...form, badgeId: e.target.value })}
                  />
                </div>
              )}
              {editing && (
                <div className="md:col-span-2 lg:col-span-3">
                  <Label>Why are you changing this? (required)</Label>
                  <Input
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="e.g. Corrected phone number from HR list"
                  />
                </div>
              )}
            </div>

            {editing && (
              <div className="mt-6 space-y-4 border-t border-silver/40 px-6 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Lunch account</h3>
                    <p className="text-sm text-silver-foreground">
                      Staff meal balance:{" "}
                      <strong className="tabular-nums text-primary">
                        {formatCurrency(editing.accountBalance ?? 0)}
                      </strong>
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    variant={showAddMoney ? "default" : "outline"}
                    className="min-h-12"
                    onClick={() => setShowAddMoney((v) => !v)}
                  >
                    <DollarSign className="h-4 w-4" />
                    {showAddMoney ? "Hide Add Money" : "Add Money"}
                  </Button>
                </div>
                {showAddMoney && (
                  <RecordStaffOfficePayment
                    staffUser={editing}
                    onDone={(balanceAfter) => {
                      setEditing((prev) =>
                        prev ? { ...prev, accountBalance: balanceAfter } : prev
                      )
                      void queryClient.invalidateQueries({ queryKey: ["users"] })
                    }}
                  />
                )}
              </div>
            )}

            {editing && (
              <div className="mt-6 space-y-4 border-t border-silver/40 px-6 pt-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Profile photo</h3>
                  <p className="text-sm text-silver-foreground">
                    Take a photo or upload a picture, then tap Save photo.
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-5">
                  <div className="space-y-2">
                    {editingPhoto ? (
                      <Image
                        src={editingPhoto}
                        alt={formatUserName(editing)}
                        width={128}
                        height={128}
                        className="h-32 w-32 rounded-2xl border border-silver/50 object-cover"
                        unoptimized={editingPhoto.startsWith("data:")}
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-silver/60 bg-silver/10 text-center text-xs font-medium text-silver-foreground">
                        No photo yet
                      </div>
                    )}
                    {pendingPhoto && (
                      <p className="text-xs font-medium text-amber-800">New photo — not saved yet</p>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:min-w-[220px]">
                    <Button
                      type="button"
                      size="lg"
                      className="min-h-14 text-base"
                      disabled={photoBusy}
                      onClick={() => triggerPhotoUpload("camera")}
                    >
                      <Camera className="h-5 w-5" />
                      Take photo
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="min-h-14 text-base"
                      disabled={photoBusy}
                      onClick={() => triggerPhotoUpload("file")}
                    >
                      <Upload className="h-5 w-5" />
                      Upload photo
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      className="min-h-14 text-base"
                      disabled={photoBusy || !pendingPhoto}
                      onClick={() => void handleSavePhoto()}
                    >
                      {photoBusy ? "Saving…" : "Save photo"}
                    </Button>
                  </div>
                </div>
                {photoMessage && (
                  <p
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      photoMessage === "Photo saved."
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "bg-silver/20 text-primary"
                    }`}
                    role="status"
                  >
                    {photoMessage}
                  </p>
                )}
              </div>
            )}

            {message && (
              <p className="mx-6 mt-4 rounded-xl bg-silver/20 px-4 py-3 text-sm font-medium text-primary">
                {message}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 px-6 pb-6">
              <Button size="lg" className="min-h-12" disabled={saving} onClick={() => void handleSave()}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create account"}
              </Button>
              <Button size="lg" variant="outline" className="min-h-12" onClick={closeEditor}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
