"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Camera, DollarSign, Pencil, Plus, Search, Upload, UserX, X } from "lucide-react"
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
import { cleanExportPhotoUrl, excelTextId } from "@/lib/import-export"
import { compressImageDataUrl } from "@/lib/images/compress-data-url"
import { studentMatchesScanId } from "@/lib/scan/scan-id"
import { formatCurrency } from "@/lib/utils"

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function parseBalanceInput(value: string): number {
  const n = Number.parseFloat(value.trim())
  return Number.isFinite(n) ? n : 0
}

function formatBalanceInput(value: number): string {
  return Number.isFinite(value) ? String(value) : "0"
}

function balanceInputsEqual(input: string, balance: number): boolean {
  return parseBalanceInput(input) === balance
}

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
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
  const [saving, setSaving] = useState(false)
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
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
  const managerCardRef = useRef<HTMLDivElement>(null)
  const managerPanelRef = useRef<HTMLDivElement>(null)

  /** Required fields only — empty optional fields (homeroom, balance) never block Save. */
  const formValid = Boolean(
    form.firstName.trim() &&
      form.lastName.trim() &&
      form.grade.trim() &&
      (editing ? true : form.id.trim())
  )

  const formDirty = editing
    ? pendingPhoto !== null ||
      form.firstName !== editing.firstName ||
      form.lastName !== editing.lastName ||
      form.grade !== editing.grade ||
      form.homeroom !== (editing.homeroom ?? "")
    : Boolean(
        form.id.trim() ||
          form.firstName.trim() ||
          form.lastName.trim() ||
          form.grade.trim() ||
          form.homeroom.trim() ||
          (form.balance.trim() && form.balance.trim() !== "0")
      )

  const filtered = useMemo(() => {
    const activeStudents = students.filter((s) => !s.disabled && !isDemoStudentExternalId(s.id))
    if (!search) return activeStudents
    const q = search.trim().toLowerCase()
    return activeStudents.filter((s) => {
      if (s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)) return true
      if (s.id.toLowerCase().includes(q) || (s.barcode && s.barcode.toLowerCase().includes(q))) {
        return true
      }
      return studentMatchesScanId(s, search)
    })
  }, [students, search])

  function scrollToImport() {
    importWizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const exportRows = useMemo(
    () =>
      students
        .filter((s) => !s.disabled && !isDemoStudentExternalId(s.id))
        .map((s) => ({
          mdId: excelTextId(s.id),
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email ?? "",
          grade: s.grade,
          badgeStatus: s.badgeStatus ?? "active",
          balance: s.balance.toFixed(2),
          parent: s.parentContacts[0]?.name ?? "",
          parentEmail: s.parentContacts[0]?.email ?? "",
          photo: "",
          photoUrl: cleanExportPhotoUrl(s.photo),
          homeroom: s.homeroom ?? "",
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
    setFormMessage(null)
    if (!formValid) {
      setFormMessage(
        editing
          ? "Enter first name, last name, and grade before saving."
          : "Enter student ID, first name, last name, and grade before saving."
      )
      return
    }
    if (editing && !formDirty) {
      setFormMessage("No changes to save.")
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const targetId = editing.id
        const fieldsChanged =
          form.firstName !== editing.firstName ||
          form.lastName !== editing.lastName ||
          form.grade !== editing.grade ||
          form.homeroom !== (editing.homeroom ?? "")

        let saved = editing
        if (fieldsChanged) {
          const updated = await updateStudent(targetId, {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            grade: form.grade.trim(),
            homeroom: form.homeroom.trim(),
          })
          if (updated) saved = updated
          else {
            saved = {
              ...editing,
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
              grade: form.grade.trim(),
              homeroom: form.homeroom.trim(),
            }
          }
        }

        // Photo-only edits count as dirty and save through the same button.
        if (pendingPhoto) {
          await savePhotoForStudent(targetId, pendingPhoto)
        }

        setEditing(saved)
        setForm({
          id: saved.id,
          firstName: saved.firstName,
          lastName: saved.lastName,
          grade: saved.grade,
          homeroom: saved.homeroom ?? "",
          balance: formatBalanceInput(saved.balance),
        })
        void queryClient.invalidateQueries({ queryKey: ["students"] })
        setFormMessage("Updated.")
      } else {
        const newId = form.id.trim()
        const newBalance = parseBalanceInput(form.balance)
        await addStudent({
          id: newId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          grade: form.grade.trim(),
          homeroom: form.homeroom.trim(),
          balance: newBalance,
          photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop",
          allergies: [],
          dietaryRestrictions: [],
          parentContacts: [],
        })
        setShowAdd(false)
        setJustAddedId(newId)
        setEditing({
          id: newId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          grade: form.grade.trim(),
          homeroom: form.homeroom.trim(),
          balance: newBalance,
          photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop",
          allergies: [],
          dietaryRestrictions: [],
          parentContacts: [],
        })
        setForm({
          id: newId,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          grade: form.grade.trim(),
          homeroom: form.homeroom.trim(),
          balance: formatBalanceInput(newBalance),
        })
        setPhotoMessage("Student saved. Now take or upload a photo for badges (optional but helpful).")
      }
    } catch (error) {
      setFormMessage(
        error instanceof Error ? error.message : "Could not save student. Try again."
      )
    } finally {
      setSaving(false)
    }
  }

  function startEdit(student: Student) {
    setShowAdd(false)
    setShowOfficePaymentPanel(false)
    setEditing(student)
    setJustAddedId(null)
    setPhotoMessage(null)
    setFormMessage(null)
    setPendingPhoto(null)
    setForm({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      homeroom: student.homeroom ?? "",
      balance: formatBalanceInput(student.balance),
    })
  }

  // Keep open profile balance/photo in sync after Add money or list refresh
  useEffect(() => {
    if (!editing) return
    const fresh = students.find((s) => s.id === editing.id)
    if (!fresh) return
    if (fresh.balance === editing.balance && fresh.photo === editing.photo) return

    const priorBalance = editing.balance
    setEditing((prev) =>
      prev && prev.id === fresh.id
        ? { ...prev, balance: fresh.balance, photo: fresh.photo }
        : prev
    )
    setForm((prev) => {
      if (!balanceInputsEqual(prev.balance, priorBalance)) return prev
      return { ...prev, balance: formatBalanceInput(fresh.balance) }
    })
  }, [students, editing?.id, editing?.balance, editing?.photo])

  function closeEditor() {
    setShowAdd(false)
    setEditing(null)
    setJustAddedId(null)
    setPhotoMessage(null)
    setFormMessage(null)
    setPendingPhoto(null)
    setShowOfficePaymentPanel(false)
    setPaymentStudentId(null)
  }

  function openAddStudent() {
    setShowAdd(true)
    setEditing(null)
    setShowOfficePaymentPanel(false)
    setPaymentStudentId(null)
    setJustAddedId(null)
    setPhotoMessage(null)
    setFormMessage(null)
    setPendingPhoto(null)
    setForm({ id: "", firstName: "", lastName: "", grade: "", homeroom: "", balance: "0" })
  }

  function openOfficePayment(studentId: string | null = null) {
    setShowOfficePaymentPanel(true)
    setPaymentStudentId(studentId)
    if (!editing) {
      setShowAdd(false)
    }
  }

  async function savePhotoForStudent(targetId: string, dataUrl: string) {
    setPhotoBusy(true)
    setPhotoMessage(null)
    try {
      const compressed = await compressImageDataUrl(dataUrl)
      if (databaseEnabled) {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (user?.id) headers["x-session-user-id"] = user.id

        const res = await fetch(`/api/students/${encodeURIComponent(targetId)}/photo`, {
          method: "POST",
          headers,
          body: JSON.stringify({ photo: compressed }),
        })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          // Fallback PATCH only when photo endpoint is unavailable; still require success.
          try {
            await updateStudent(targetId, { photo: compressed })
          } catch (fallbackError) {
            throw new Error(
              body.error ??
                (fallbackError instanceof Error
                  ? fallbackError.message
                  : "Could not save the photo.")
            )
          }
        }
        void queryClient.invalidateQueries({ queryKey: ["students"] })
      } else {
        await updateStudent(targetId, { photo: compressed })
      }
      void queryClient.invalidateQueries({ queryKey: ["badges"] })
      setPendingPhoto(null)
      setPhotoMessage("Photo saved for badges")
      if (editing?.id === targetId) {
        setEditing((prev) => (prev ? { ...prev, photo: compressed } : prev))
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not save the photo. Try again with a smaller image."
      setPhotoMessage(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const compressed = await compressImageDataUrl(dataUrl)
      setPendingPhoto(compressed)
      setFormMessage(null)
      setPhotoMessage("Preview ready. Tap Save photo or Update to put this on badges and checkout.")
    } catch {
      setPhotoMessage("Could not read that image. Try another file.")
    }
    e.target.value = ""
  }

  function triggerPhotoUpload(mode: "file" | "camera" = "file") {
    if (!editing) return
    const ref = mode === "camera" ? cameraInputRef : photoInputRef
    ref.current?.click()
  }

  async function handleSavePhoto() {
    if (!editing) return
    if (!pendingPhoto) {
      setPhotoMessage("Take or upload a photo first, then tap Save photo.")
      return
    }
    try {
      await savePhotoForStudent(editing.id, pendingPhoto)
    } catch {
      // Message already set in savePhotoForStudent
    }
  }

  const showPageHeader = !embedded && !importsTab
  const showImportWizard = !embedded || importsTab
  const showImportExportMenu = !embedded || importsTab
  const savedPhoto = editing
    ? students.find((s) => s.id === editing.id)?.photo ?? editing.photo
    : null
  const editingPhoto = pendingPhoto ?? savedPhoto
  const sheetOpen = Boolean(showAdd || editing || showOfficePaymentPanel)
  const paymentFromProfile = showOfficePaymentPanel && Boolean(editing || showAdd)

  // Mobile fullscreen sheet only — never lock desktop main scroll (PR #33 regression).
  useEffect(() => {
    if (!sheetOpen || !isMobileViewport()) return
    const main = document.querySelector(".admin-portal main") as HTMLElement | null
    if (!main) return
    const prev = main.style.overflowY
    main.style.overflowY = "hidden"
    return () => {
      main.style.overflowY = prev
    }
  }, [sheetOpen])

  // After profile/add/payment replaces the list, bring Student Manager to the top.
  useEffect(() => {
    if (!sheetOpen) return
    const frame = requestAnimationFrame(() => {
      const main = document.querySelector(".admin-portal main") as HTMLElement | null
      const card = managerCardRef.current
      if (main && card) {
        const mainTop = main.getBoundingClientRect().top
        const cardTop = card.getBoundingClientRect().top
        main.scrollTo({ top: Math.max(0, main.scrollTop + (cardTop - mainTop) - 12), behavior: "smooth" })
      } else {
        card?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      managerPanelRef.current?.scrollTo?.({ top: 0 })
    })
    return () => cancelAnimationFrame(frame)
  }, [sheetOpen, editing?.id, showAdd, showOfficePaymentPanel])

  function handlePanelBack() {
    if (paymentFromProfile) {
      setShowOfficePaymentPanel(false)
      setPaymentStudentId(null)
      return
    }
    closeEditor()
  }

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
              <Button variant="outline" onClick={() => openOfficePayment(null)}>
                <DollarSign className="h-4 w-4" />
                Add or take money off
              </Button>
              <Button onClick={openAddStudent}>
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
              <Button variant="outline" onClick={() => openOfficePayment(null)}>
                <DollarSign className="h-4 w-4" />
                Add or take money off
              </Button>
              <Button onClick={openAddStudent}>
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        )}

        {justAddedId && !editing && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            Student saved. Use <strong>Open profile</strong> to take or upload a photo for badges, or
            <strong> Add or take money off</strong> if they paid today.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div ref={managerCardRef} className="min-w-0 lg:col-span-2">
          <Card
            className={`relative min-w-0 p-0 ${sheetOpen ? "overflow-visible" : "overflow-hidden"}`}
          >
            {sheetOpen ? (
              <div
                ref={managerPanelRef}
                className="fixed inset-0 z-50 flex flex-col bg-white md:static md:z-auto md:max-h-[min(78vh,860px)]"
                role="dialog"
                aria-modal="true"
                aria-label={
                  showOfficePaymentPanel
                    ? "Add or take money off"
                    : editing
                      ? "Student profile"
                      : "Add Student"
                }
              >
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-silver/60 bg-white px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
                  <div className="min-w-0 flex-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="mb-1 -ml-2 h-auto min-h-10 gap-1.5 px-2 text-sm font-semibold text-primary"
                      onClick={handlePanelBack}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {paymentFromProfile ? "Back to profile" : "Back to list"}
                    </Button>
                    <h2 className="text-lg font-semibold text-primary sm:text-xl">
                      {showOfficePaymentPanel
                        ? "Add or take money off"
                        : editing
                          ? "Student profile"
                          : "Add Student"}
                    </h2>
                    {editing && !showOfficePaymentPanel && (
                      <p className="mt-0.5 text-sm text-silver-foreground">
                        Update details, balance, and photo inside Student Manager. Changes save to
                        their lunch account immediately.
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 min-w-11 shrink-0 md:hidden"
                    onClick={handlePanelBack}
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                  {showOfficePaymentPanel ? (
                    <RecordOfficePayment
                      students={students.filter((s) => !isDemoStudentExternalId(s.id))}
                      initialStudentId={paymentStudentId ?? undefined}
                      onDone={() => {
                        void queryClient.invalidateQueries({ queryKey: ["students"] })
                      }}
                    />
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {!editing && (
                          <div>
                            <Label>Student ID</Label>
                            <Input
                              value={form.id}
                              onChange={(e) => {
                                setFormMessage(null)
                                setForm({ ...form, id: e.target.value })
                              }}
                            />
                          </div>
                        )}
                        <div>
                          <Label>First Name</Label>
                          <Input
                            value={form.firstName}
                            onChange={(e) => {
                              setFormMessage(null)
                              setForm({ ...form, firstName: e.target.value })
                            }}
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={form.lastName}
                            onChange={(e) => {
                              setFormMessage(null)
                              setForm({ ...form, lastName: e.target.value })
                            }}
                          />
                        </div>
                        <div>
                          <Label>Grade</Label>
                          <Input
                            value={form.grade}
                            onChange={(e) => {
                              setFormMessage(null)
                              setForm({ ...form, grade: e.target.value })
                            }}
                          />
                        </div>
                        <div>
                          <Label>Homeroom</Label>
                          <Input
                            value={form.homeroom}
                            onChange={(e) => {
                              setFormMessage(null)
                              setForm({ ...form, homeroom: e.target.value })
                            }}
                          />
                        </div>
                        <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] p-3 md:col-span-2 lg:col-span-3">
                          {editing ? (
                            <>
                              <p className="text-sm font-semibold text-primary">Lunch account</p>
                              <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                                {formatCurrency(editing.balance)}
                              </p>
                              <p className="mt-1 text-xs text-silver-foreground">
                                Add money when cash or a check is received. Take money off for a
                                correction, refund, or mistake. This writes a history line — it is
                                not a lunch charge.
                              </p>
                              <div className="mt-3">
                                <RecordOfficePayment
                                  students={[editing]}
                                  initialStudentId={editing.id}
                                  compact
                                  onDone={(balanceAfter) => {
                                    setEditing((prev) =>
                                      prev ? { ...prev, balance: balanceAfter } : prev
                                    )
                                    setForm((prev) => ({
                                      ...prev,
                                      balance: formatBalanceInput(balanceAfter),
                                    }))
                                    void queryClient.invalidateQueries({ queryKey: ["students"] })
                                    void queryClient.invalidateQueries({
                                      queryKey: ["transactions"],
                                    })
                                  }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <Label htmlFor="student-balance">Starting balance</Label>
                              <Input
                                id="student-balance"
                                inputMode="decimal"
                                value={form.balance}
                                onChange={(e) => {
                                  setFormMessage(null)
                                  setForm({ ...form, balance: e.target.value })
                                }}
                                className="mt-1 text-lg font-semibold tabular-nums sm:max-w-xs"
                              />
                              <p className="mt-1 text-xs text-silver-foreground">
                                Optional. You can add or take money off later from this profile.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {editing && (
                        <div className="mt-6 space-y-4 border-t border-silver/40 pt-6">
                          <div>
                            <h3 className="text-lg font-semibold text-primary">Badge photo</h3>
                            <p className="text-sm text-silver-foreground">
                              Take a photo with your phone camera or upload a picture, then tap Save
                              photo (or Update below). This same photo shows on badges and when the
                              badge is scanned at checkout.
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
                                <p className="text-xs font-medium text-amber-800">
                                  New photo — not saved yet
                                </p>
                              )}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:min-w-[220px]">
                              <Button
                                type="button"
                                size="lg"
                                className="min-h-14 text-base"
                                disabled={photoBusy || saving}
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
                                disabled={photoBusy || saving}
                                onClick={() => triggerPhotoUpload("file")}
                              >
                                <Upload className="h-5 w-5" />
                                Upload photo
                              </Button>
                              <Button
                                type="button"
                                size="lg"
                                className="min-h-14 text-base"
                                disabled={photoBusy || saving}
                                onClick={() => void handleSavePhoto()}
                              >
                                {photoBusy ? "Saving…" : "Save photo"}
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
                              className="min-h-12 w-full sm:w-auto"
                              onClick={() => openOfficePayment(editing.id)}
                            >
                              <DollarSign className="h-4 w-4" />
                              Add or take money off
                            </Button>
                          </div>
                        </div>
                      )}

                      {formMessage && (
                        <p
                          className="mt-4 rounded-xl bg-silver/20 px-4 py-3 text-sm font-medium text-primary"
                          role="status"
                        >
                          {formMessage}
                        </p>
                      )}

                      <div className="sticky bottom-0 mt-4 flex flex-wrap gap-3 border-t border-silver/40 bg-white/95 py-4 backdrop-blur-sm">
                        <Button
                          size="lg"
                          className="min-h-12 flex-1 font-semibold sm:min-w-[10rem] sm:flex-none"
                          disabled={saving || photoBusy || !formValid}
                          onClick={() => void handleSave()}
                        >
                          {saving ? "Saving…" : editing ? "Update" : "Save student"}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="min-h-12 flex-1 sm:flex-none"
                          disabled={saving || photoBusy}
                          onClick={closeEditor}
                        >
                          Back to list
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <CardHeader className="px-3 pt-3 sm:px-6 sm:pt-6">
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
                <div className="space-y-3 px-1 pb-4 sm:px-2 md:hidden">
                  {filtered.length === 0 ? (
                    <p className="py-8 text-center text-sm text-silver-foreground">
                      No students yet. Tap <strong>Add Student</strong> or import a spreadsheet below.
                    </p>
                  ) : (
                    filtered.map((s) => (
                      <div
                        key={s.id}
                        className={`rounded-2xl border border-silver/50 bg-silver/5 p-3 ${s.disabled ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(s)}
                            className="shrink-0"
                            title="Open profile to update photo"
                            disabled={s.disabled}
                          >
                            <Image
                              src={s.photo}
                              alt={s.firstName}
                              width={56}
                              height={56}
                              className="h-14 w-14 rounded-xl object-cover"
                              unoptimized={s.photo.startsWith("data:")}
                            />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-primary">
                              {s.firstName} {s.lastName}
                              {s.disabled && (
                                <Badge variant="danger" className="ml-2 align-middle">
                                  Disabled
                                </Badge>
                              )}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-silver-foreground">{s.id}</p>
                            <p className="mt-1 text-sm text-silver-foreground">
                              Grade {s.grade} · {formatCurrency(s.balance)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => startEdit(s)}
                            disabled={s.disabled}
                            className="min-h-10 flex-1 gap-1.5 font-semibold"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Open profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={s.disabled}
                            className="min-h-10 flex-1"
                            onClick={() => openOfficePayment(s.id)}
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            Add or take money off
                          </Button>
                          {!s.disabled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="min-h-10"
                              onClick={() => void disableStudent(s.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mobile-scroll-x hidden px-3 pb-6 sm:px-6 md:block">
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
                        <tr
                          key={s.id}
                          className={`border-b border-silver/30 ${s.disabled ? "opacity-50" : ""}`}
                        >
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
                            {s.disabled && (
                              <Badge variant="danger" className="ml-2">
                                Disabled
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 pr-4">{s.grade}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {formatCurrency(s.balance)}
                          </td>
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
                                onClick={() => openOfficePayment(s.id)}
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                                Add or take money off
                              </Button>
                              {!s.disabled && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void disableStudent(s.id)}
                                >
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
              </>
            )}
          </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Signup Sheet</CardTitle>
            </CardHeader>
            <div className="space-y-3 px-6 pb-6">
              {Object.entries(signupTotals)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([grade, count]) => (
                  <div
                    key={grade}
                    className="flex items-center justify-between rounded-2xl bg-silver/20 px-4 py-3"
                  >
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

        {showImportWizard && !sheetOpen && (
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
