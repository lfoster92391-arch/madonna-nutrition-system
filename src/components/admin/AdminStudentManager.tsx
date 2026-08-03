"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { Camera, DollarSign, Pencil, Plus, Search, Upload, UserX } from "lucide-react"
import { CsvImportWizard } from "@/components/admin/CsvImportWizard"
import { DesktopOnly } from "@/components/admin/DesktopOnly"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { RecordOfficePayment } from "@/components/admin/RecordOfficePayment"
import { useDemo } from "@/components/providers/DemoProvider"
import { useAuth } from "@/components/providers/AuthProvider"
import { isDemoStudentExternalId } from "@/config/demo-students"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import type { Student } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AdminStudentManager({
  embedded = false,
  importsTab = false,
}: {
  embedded?: boolean
  /** Render inside /admin/imports Students tab (no page header, includes SIS import wizard) */
  importsTab?: boolean
}) {
  const { students, addStudent, updateStudent, disableStudent, databaseEnabled } = useDemo()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Student | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [justAddedId, setJustAddedId] = useState<string | null>(null)
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null)
  const [showOfficePaymentPanel, setShowOfficePaymentPanel] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [form, setForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    grade: "",
    homeroom: "",
    balance: "0",
  })
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const importWizardRef = useRef<HTMLDivElement>(null)
  const editFormRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const activeStudents = students.filter((s) => !s.disabled && !isDemoStudentExternalId(s.id))
    if (!search) return activeStudents
    const q = search.toLowerCase()
    return activeStudents.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.id.includes(q)
    )
  }, [students, search])

  function scrollToImport() {
    importWizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const exportRows = useMemo(
    () =>
      students
        .filter((s) => !s.disabled && !isDemoStudentExternalId(s.id))
        .map((s) => ({
          mdId: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          homeroom: s.homeroom ?? "",
          balance: s.balance.toFixed(2),
          photoUrl: s.photo,
          parentEmail: s.parentContacts[0]?.email ?? "",
          parentPhone: s.parentContacts[0]?.phone ?? "",
          allergies: s.allergies.map((a) => a.name).join(", "),
          dietaryRestrictions: s.dietaryRestrictions.join(", "),
        })),
    [students]
  )
  const signupTotals = useMemo(() => {
    const byGrade: Record<string, number> = {}
    students.filter((s) => !s.disabled).forEach((s) => {
      byGrade[s.grade] = (byGrade[s.grade] ?? 0) + 1
    })
    return byGrade
  }, [students])

  async function handleSave() {
    if (editing) {
      await updateStudent(editing.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        grade: form.grade,
        homeroom: form.homeroom,
        balance: parseFloat(form.balance),
      })
      setEditing(null)
      setJustAddedId(null)
    } else {
      const newId = form.id.trim()
      await addStudent({
        id: newId,
        firstName: form.firstName,
        lastName: form.lastName,
        grade: form.grade,
        homeroom: form.homeroom,
        balance: parseFloat(form.balance),
        photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop",
        allergies: [],
        dietaryRestrictions: [],
        parentContacts: [],
      })
      setShowAdd(false)
      setJustAddedId(newId)
      setEditing({
        id: newId,
        firstName: form.firstName,
        lastName: form.lastName,
        grade: form.grade,
        homeroom: form.homeroom,
        balance: parseFloat(form.balance) || 0,
        photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop",
        allergies: [],
        dietaryRestrictions: [],
        parentContacts: [],
      })
      setPhotoMessage("Student saved. Now take or upload a photo for badges (optional but helpful).")
      requestAnimationFrame(() => {
        editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
    setForm({ id: "", firstName: "", lastName: "", grade: "", homeroom: "", balance: "0" })
  }

  function startEdit(student: Student) {
    setShowAdd(false)
    setEditing(student)
    setJustAddedId(null)
    setPhotoMessage(null)
    setPendingPhoto(null)
    setForm({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      homeroom: student.homeroom ?? "",
      balance: student.balance.toString(),
    })
    requestAnimationFrame(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function closeEditor() {
    setShowAdd(false)
    setEditing(null)
    setJustAddedId(null)
    setPhotoMessage(null)
    setPendingPhoto(null)
  }

  async function savePhotoForStudent(targetId: string, dataUrl: string) {
    setPhotoBusy(true)
    setPhotoMessage(null)
    try {
      if (databaseEnabled) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (user?.id) headers["x-session-user-id"] = user.id

        const res = await fetch(`/api/students/${encodeURIComponent(targetId)}/photo`, {
          method: "POST",
          headers,
          body: JSON.stringify({ photo: dataUrl }),
        })
        if (!res.ok) {
          await updateStudent(targetId, { photo: dataUrl })
        } else {
          void queryClient.invalidateQueries({ queryKey: ["students"] })
        }
      } else {
        await updateStudent(targetId, { photo: dataUrl })
      }
      void queryClient.invalidateQueries({ queryKey: ["badges"] })
      setPendingPhoto(null)
      setPhotoMessage("Photo saved for badges")
      if (editing?.id === targetId) {
        setEditing((prev) => (prev ? { ...prev, photo: dataUrl } : prev))
      }
    } catch {
      setPhotoMessage("Could not save the photo. Try again with a smaller image.")
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    const dataUrl = await readFileAsDataUrl(file)
    setPendingPhoto(dataUrl)
    setPhotoMessage("Preview ready. Tap Save to put this photo on badges and checkout.")
    e.target.value = ""
  }

  function triggerPhotoUpload(mode: "file" | "camera" = "file") {
    if (!editing) return
    const ref = mode === "camera" ? cameraInputRef : photoInputRef
    ref.current?.click()
  }

  async function handleSavePhoto() {
    if (!editing || !pendingPhoto) return
    await savePhotoForStudent(editing.id, pendingPhoto)
  }

  const showPageHeader = !embedded && !importsTab
  const showImportWizard = !embedded || importsTab
  const showImportExportMenu = !embedded || importsTab
  const savedPhoto = editing
    ? students.find((s) => s.id === editing.id)?.photo ?? editing.photo
    : null
  const editingPhoto = pendingPhoto ?? savedPhoto

  return (
    <div className={showPageHeader ? "admin-page-pad" : "w-full min-w-0"}>
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
        capture="environment"
        className="hidden"
        onChange={(e) => void handlePhotoUpload(e)}
      />

      <div className="mx-auto max-w-full space-y-5 sm:space-y-8">
        {showPageHeader && (
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-silver-foreground">
                Setup
              </p>
              <h1 className="text-2xl font-bold text-primary sm:text-3xl">Students</h1>
              <p className="text-sm text-silver-foreground sm:text-base">
                Add students, open a profile to take or upload a photo for badges, and add money to
                lunch accounts
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3">
              {showImportExportMenu && (
                <ImportExportMenu
                  type="students"
                  onImport={scrollToImport}
                  exportRows={exportRows}
                />
              )}
              <Button variant="outline" asChild>
                <Link href="/admin/allergy-review">Allergy Review Queue</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOfficePaymentPanel(true)
                  setPaymentStudentId(null)
                }}
              >
                <DollarSign className="h-4 w-4" />
                Add money to account
              </Button>
              <Button
                onClick={() => {
                  setShowAdd(true)
                  setEditing(null)
                  setJustAddedId(null)
                  setPhotoMessage(null)
                  setPendingPhoto(null)
                }}
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        )}

        {(embedded || importsTab) && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-primary">Student Manager</h2>
              <p className="text-sm text-silver-foreground">
                After you add a student, tap <strong>Open profile</strong> to take or upload a photo
                for their badge
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {showImportExportMenu && (
                <ImportExportMenu
                  type="students"
                  onImport={scrollToImport}
                  exportRows={exportRows}
                />
              )}
              <Button variant="outline" asChild>
                <Link href="/admin/allergy-review">Allergy Review Queue</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOfficePaymentPanel(true)
                  setPaymentStudentId(null)
                }}
              >
                <DollarSign className="h-4 w-4" />
                Add money to account
              </Button>
              <Button
                onClick={() => {
                  setShowAdd(true)
                  setEditing(null)
                  setJustAddedId(null)
                  setPhotoMessage(null)
                  setPendingPhoto(null)
                }}
              >
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        )}

        {justAddedId && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            Student saved. Use <strong>Open profile</strong> below to take or upload a photo for
            badges, or <strong>Add money to account</strong> if they paid today.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Student Manager</CardTitle>
            </CardHeader>
            <div className="relative mb-4 px-3 sm:px-6">
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-silver-foreground sm:left-10" />
              <Input
                className="pl-12"
                placeholder="Search by name or student ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="mobile-scroll-x px-3 pb-6 sm:px-6">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-silver/60 text-silver-foreground">
                    <th className="pb-3 pr-4 text-left font-medium">Photo</th>
                    <th className="pb-3 pr-4 text-left font-medium">MD ID</th>
                    <th className="pb-3 pr-4 text-left font-medium">Name</th>
                    <th className="pb-3 pr-4 text-left font-medium">Grade</th>
                    <th className="pb-3 pr-4 text-right font-medium">Balance</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-silver-foreground">
                        No students yet. Tap <strong>Add Student</strong> or import a spreadsheet
                        below.
                      </td>
                    </tr>
                  ) : null}
                  {filtered.map((s) => (
                    <tr key={s.id} className={`border-b border-silver/30 ${s.disabled ? "opacity-50" : ""}`}>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className="group relative"
                          title="Open profile to update photo"
                          disabled={s.disabled}
                        >
                          <Image
                            src={s.photo}
                            alt={s.firstName}
                            width={48}
                            height={48}
                            className="rounded-xl object-cover"
                            unoptimized={s.photo.startsWith("data:")}
                          />
                          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-primary/60 opacity-0 transition group-hover:opacity-100">
                            <Camera className="h-5 w-5 text-white" />
                          </span>
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-silver-foreground">{s.id}</span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-primary">
                        {s.firstName} {s.lastName}
                        {s.disabled && <Badge variant="danger" className="ml-2">Disabled</Badge>}
                      </td>
                      <td className="py-3 pr-4">{s.grade}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(s.balance)}</td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => startEdit(s)}
                            disabled={s.disabled}
                            className="min-h-10 gap-1.5 font-semibold"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Open profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={s.disabled}
                            onClick={() => {
                              setPaymentStudentId(s.id)
                              setShowOfficePaymentPanel(true)
                            }}
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            Add money
                          </Button>
                          {!s.disabled && (
                            <Button size="sm" variant="ghost" onClick={() => void disableStudent(s.id)}>
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Signup Sheet</CardTitle>
            </CardHeader>
            <div className="space-y-3 px-6 pb-6">
              {Object.entries(signupTotals)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([grade, count]) => (
                  <div key={grade} className="flex items-center justify-between rounded-2xl bg-silver/20 px-4 py-3">
                    <span className="font-medium text-primary">Grade {grade}</span>
                    <span className="text-2xl font-bold text-primary">{count}</span>
                  </div>
                ))}
              {Object.keys(signupTotals).length === 0 && (
                <p className="text-sm text-silver-foreground">No active students yet.</p>
              )}
              <div className="mt-4 border-t border-silver/60 pt-4">
                <div className="flex justify-between font-semibold text-primary">
                  <span>Total Active</span>
                  <span>{students.filter((s) => !s.disabled).length}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {(showAdd || editing) && (
          <div ref={editFormRef}>
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Student profile" : "Add Student"}</CardTitle>
              {editing && (
                <p className="text-sm text-silver-foreground">
                  Update details and photo. The photo is used on badges, Badge Manager, and lunch
                  line checkout.
                </p>
              )}
            </CardHeader>
            <div className="grid gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
              {!editing && (
                <div>
                  <Label>Student ID</Label>
                  <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
                </div>
              )}
              <div>
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <Label>Grade</Label>
                <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
              </div>
              <div>
                <Label>Homeroom</Label>
                <Input value={form.homeroom} onChange={(e) => setForm({ ...form, homeroom: e.target.value })} />
              </div>
              <div>
                <Label>Balance</Label>
                <Input value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
                <p className="mt-1 text-xs text-silver-foreground">
                  Prefer &quot;Add money to account&quot; when cash or a check is received in the office.
                </p>
              </div>
            </div>

            {editing && (
              <div className="mt-6 space-y-4 border-t border-silver/40 px-6 pt-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary">Badge photo</h3>
                  <p className="text-sm text-silver-foreground">
                    Take a photo with your phone camera or upload a picture, then tap Save. This
                    same photo shows on badges and when the badge is scanned at checkout.
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-5">
                  <div className="space-y-2">
                    {editingPhoto ? (
                      <Image
                        src={editingPhoto}
                        alt={`${editing.firstName} ${editing.lastName}`}
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
                      {photoBusy ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </div>
                {photoMessage && (
                  <p
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      photoMessage === "Photo saved for badges"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "bg-silver/20 text-primary"
                    }`}
                    role="status"
                  >
                    {photoMessage}
                  </p>
                )}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="min-h-12"
                    onClick={() => {
                      setPaymentStudentId(editing.id)
                      setShowOfficePaymentPanel(true)
                    }}
                  >
                    <DollarSign className="h-4 w-4" />
                    Add money to account
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 px-6 pb-6">
              <Button size="lg" className="min-h-12" onClick={() => void handleSave()}>
                {editing ? "Save changes" : "Save student"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-12"
                onClick={closeEditor}
              >
                Cancel
              </Button>
            </div>
          </Card>
          </div>
        )}

        {showOfficePaymentPanel && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-primary">Add money to account</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowOfficePaymentPanel(false)
                  setPaymentStudentId(null)
                }}
              >
                Close
              </Button>
            </div>
            <RecordOfficePayment
              students={students.filter((s) => !isDemoStudentExternalId(s.id))}
              initialStudentId={paymentStudentId ?? undefined}
              onDone={() => {
                void queryClient.invalidateQueries({ queryKey: ["students"] })
              }}
            />
          </div>
        )}

        {showImportWizard && (
          <DesktopOnly>
            <div ref={importWizardRef}>
              <CsvImportWizard />
            </div>
          </DesktopOnly>
        )}
      </div>
    </div>
  )
}
