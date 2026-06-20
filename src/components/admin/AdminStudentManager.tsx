"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Camera, Plus, Search, UserX } from "lucide-react"
import { CsvImportWizard } from "@/components/admin/CsvImportWizard"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { useDemo } from "@/components/providers/DemoProvider"
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
  const { students, addStudent, updateStudent, disableStudent } = useDemo()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Student | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    grade: "",
    homeroom: "",
    balance: "0",
  })
  const photoInputRef = useRef<HTMLInputElement>(null)
  const importWizardRef = useRef<HTMLDivElement>(null)
  const [photoTargetId, setPhotoTargetId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search) return students
    const q = search.toLowerCase()
    return students.filter(
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
        .filter((s) => !s.disabled)
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
    } else {
      await addStudent({
        id: form.id,
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
    }
    setForm({ id: "", firstName: "", lastName: "", grade: "", homeroom: "", balance: "0" })
  }

  function startEdit(student: Student) {
    setEditing(student)
    setForm({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      homeroom: student.homeroom ?? "",
      balance: student.balance.toString(),
    })
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const targetId = photoTargetId
    if (!file || !targetId) return
    const dataUrl = await readFileAsDataUrl(file)
    await updateStudent(targetId, { photo: dataUrl })
    setPhotoTargetId(null)
    e.target.value = ""
  }

  function triggerPhotoUpload(studentId: string) {
    setPhotoTargetId(studentId)
    photoInputRef.current?.click()
  }

  const showPageHeader = !embedded && !importsTab
  const showImportWizard = !embedded || importsTab
  const showImportExportMenu = !embedded || importsTab

  return (
    <div className={showPageHeader ? "w-full px-6 py-8 md:px-8" : "w-full"}>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      <div className="mx-auto max-w-full space-y-8">
        {showPageHeader && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-silver-foreground">
                Launch
              </p>
              <h1 className="text-3xl font-bold text-primary">Parent Imports</h1>
              <p className="text-silver-foreground">
                Student management, SIS import, and photo upload
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
              <Button onClick={() => { setShowAdd(true); setEditing(null) }}>
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
                Manage students before linking parent accounts
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
              <Button onClick={() => { setShowAdd(true); setEditing(null) }}>
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Student Manager</CardTitle>
            </CardHeader>
            <div className="relative mb-4 px-6">
              <Search className="absolute left-10 top-1/2 h-5 w-5 -translate-y-1/2 text-silver-foreground" />
              <Input
                className="pl-12"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full text-sm">
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
                  {filtered.map((s) => (
                    <tr key={s.id} className={`border-b border-silver/30 ${s.disabled ? "opacity-50" : ""}`}>
                      <td className="py-3 pr-4">
                        <button
                          type="button"
                          onClick={() => triggerPhotoUpload(s.id)}
                          className="group relative"
                          title="Upload photo"
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
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(s)} disabled={s.disabled}>
                            Edit
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
          <Card>
            <CardHeader>
              <CardTitle>{editing ? "Edit Student" : "Add Student"}</CardTitle>
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
              </div>
            </div>
            <div className="mt-4 flex gap-3 px-6 pb-6">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setEditing(null) }}>Cancel</Button>
            </div>
          </Card>
        )}

        {showImportWizard && (
          <div ref={importWizardRef}>
            <CsvImportWizard />
          </div>
        )}
      </div>
    </div>
  )
}
