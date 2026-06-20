"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Archive, Bell, Download, Eye, FileText, Plus, Search, Send } from "lucide-react"
import { AgreementPreview } from "@/components/agreements/AgreementPreview"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  DEFAULT_AGREEMENT_CONTENT,
  DEFAULT_PUBLISHED_VERSION,
} from "@/config/agreement-defaults"
import type { AgreementContent } from "@/config/agreement-defaults"
import type { AgreementDashboardRow, AgreementVersionDto } from "@/lib/agreements/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ADMIN_NAVY } from "@/components/admin/layout/admin-theme"

interface AdminNotification {
  id: string
  title: string
  parentName: string | null
  studentCount: number
  date: string
  signatureId: string | null
}

export function AdminAgreementsPage() {
  const { user } = useAuth()
  const [versions, setVersions] = useState<AgreementVersionDto[]>([])
  const [rows, setRows] = useState<AgreementDashboardRow[]>([])
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [parentQuery, setParentQuery] = useState("")
  const [studentQuery, setStudentQuery] = useState("")
  const [draftContent, setDraftContent] = useState<AgreementContent>(DEFAULT_AGREEMENT_CONTENT)
  const [draftLabel, setDraftLabel] = useState("V1")
  const [effectiveDate, setEffectiveDate] = useState("2025-08-01")
  const [expiresAt, setExpiresAt] = useState("2026-07-31")
  const [toast, setToast] = useState<string | null>(null)
  const [previewRecord, setPreviewRecord] = useState<AgreementDashboardRow | null>(null)

  const selectedVersion = useMemo(
    () =>
      selectedVersionId
        ? (versions.find((v) => v.id === selectedVersionId) ?? null)
        : null,
    [versions, selectedVersionId]
  )

  const load = useCallback(async () => {
    const [versionsRes, dashboardRes] = await Promise.all([
      fetch("/api/agreements/versions"),
      fetch(`/api/agreements/dashboard?parent=${encodeURIComponent(parentQuery)}&student=${encodeURIComponent(studentQuery)}`),
    ])
    if (versionsRes.ok) {
      const data = await versionsRes.json()
      setVersions(data)
      if (!selectedVersionId && data[0]) setSelectedVersionId(data[0].id)
    }
    if (dashboardRes.ok) {
      const data = await dashboardRes.json()
      setRows(data.rows ?? [])
      setNotifications(data.notifications ?? [])
    }
  }, [parentQuery, studentQuery, selectedVersionId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (selectedVersion) {
      setDraftContent(selectedVersion.content)
      setDraftLabel(selectedVersion.versionLabel)
      setEffectiveDate(selectedVersion.effectiveDate.slice(0, 10))
      setExpiresAt(selectedVersion.expiresAt?.slice(0, 10) ?? "")
    }
  }, [selectedVersion])

  async function saveDraft() {
    const payload = {
      versionLabel: draftLabel,
      effectiveDate: new Date(effectiveDate).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      content: draftContent,
      performedBy: user?.id,
    }

    if (selectedVersion?.status === "DRAFT") {
      await fetch(`/api/agreements/versions/${selectedVersion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      const res = await fetch("/api/agreements/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const created = await res.json()
      if (created.id) setSelectedVersionId(created.id)
    }
    setToast("Draft saved")
    void load()
  }

  async function publishDraft() {
    if (!selectedVersion || selectedVersion.status !== "DRAFT") {
      setToast("Select a draft version to publish")
      return
    }
    await fetch(`/api/agreements/versions/${selectedVersion.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ performedBy: user?.id }),
    })
    setToast("Agreement published — parents will be prompted to sign")
    void load()
  }

  async function archiveVersion() {
    if (!selectedVersion) return
    await fetch(`/api/agreements/versions/${selectedVersion.id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ performedBy: user?.id }),
    })
    setToast("Version archived")
    void load()
  }

  function exportRecordPdf(record: AgreementDashboardRow) {
    const html = `<html><body><h1>Fuel The Dons Cafeteria Agreement Record</h1>
      <p>Parent: ${record.parentName}</p>
      <p>Students: ${record.students.join(", ")}</p>
      <p>Version: ${record.versionLabel}</p>
      <p>Signed: ${record.signedAt ? new Date(record.signedAt).toLocaleString() : "No"}</p>
      <p>IP: ${record.ipAddress ?? "N/A"}</p>
      <p>Status: ${record.status}</p></body></html>`
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(html)
      win.document.close()
      win.print()
    }
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ADMIN_NAVY }}>
          Operations
        </p>
        <h1 className="text-3xl font-bold" style={{ color: ADMIN_NAVY }}>
          Cafeteria Agreements
        </h1>
        <p className="mt-1 text-sm text-[#AEB6C2]">
          Build, publish, and track Fuel The Dons digital cafeteria agreement signatures.
        </p>
      </div>

      {toast ? (
        <div className="rounded-2xl border border-[#00A83E]/30 bg-[#00A83E]/10 px-4 py-3 text-sm text-[#00A83E]">
          {toast}
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <Card className="rounded-[20px] border-[#041B52]/20 p-4">
          <div className="flex items-center gap-2 font-semibold" style={{ color: ADMIN_NAVY }}>
            <Bell className="h-4 w-4" />
            Recent Signatures
          </div>
          <div className="mt-3 space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {n.title} — {n.parentName} ({n.studentCount} students)
                </span>
                <span className="text-[#AEB6C2]">{new Date(n.date).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="builder">Agreement Builder</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AEB6C2]" />
              <Input
                placeholder="Search parent"
                value={parentQuery}
                onChange={(e) => setParentQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AEB6C2]" />
              <Input
                placeholder="Search student"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => void load()}>
              Search
            </Button>
          </div>

          <Card className="overflow-x-auto rounded-[20px] p-0">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-[#AEB6C2]/60 text-left text-[#AEB6C2]">
                  <th className="p-4 font-medium">Parent</th>
                  <th className="p-4 font-medium">Student(s)</th>
                  <th className="p-4 font-medium">Version</th>
                  <th className="p-4 font-medium">Signed</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">IP Logged</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#AEB6C2]">
                      No agreement signatures recorded yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#AEB6C2]/30">
                      <td className="p-4 font-medium" style={{ color: ADMIN_NAVY }}>
                        {row.parentName}
                        {row.parentEmail ? (
                          <p className="text-xs font-normal text-[#AEB6C2]">{row.parentEmail}</p>
                        ) : null}
                      </td>
                      <td className="p-4">{row.students.join(", ")}</td>
                      <td className="p-4">{row.versionLabel}</td>
                      <td className="p-4">{row.signed ? "Yes" : "No"}</td>
                      <td className="p-4">
                        {row.signedAt ? new Date(row.signedAt).toLocaleString() : "—"}
                      </td>
                      <td className="p-4 font-mono text-xs">{row.ipAddress ?? "—"}</td>
                      <td className="p-4">{row.status}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setPreviewRecord(row)}>
                            <Eye className="mr-1 h-3 w-3" /> View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportRecordPdf(row)}>
                            <Download className="mr-1 h-3 w-3" /> PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedVersionId(null)
                setDraftContent(DEFAULT_AGREEMENT_CONTENT)
                setDraftLabel(`V${(versions[0]?.versionNumber ?? 0) + 1}`)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Draft
            </Button>
            <Button onClick={() => void saveDraft()}>
              <FileText className="mr-2 h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={() => void publishDraft()}>
              <Send className="mr-2 h-4 w-4" /> Publish
            </Button>
            <Button variant="outline" onClick={() => void archiveVersion()}>
              <Archive className="mr-2 h-4 w-4" /> Archive
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="space-y-4 rounded-[20px] p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Version Label</Label>
                  <Input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} />
                </div>
                <div>
                  <Label>Effective Date</Label>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Expires</Label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Section 1 — Meal Sign-Up Policy</Label>
                <textarea
                  className="mt-1 min-h-[180px] w-full rounded-2xl border border-[#AEB6C2]/60 p-4 text-sm"
                  value={draftContent.mealSignUpPolicy}
                  onChange={(e) =>
                    setDraftContent({ ...draftContent, mealSignUpPolicy: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["mainMeal", "Main Meal ($)"],
                    ["premiumSides", "Premium Sides ($)"],
                    ["lightMeal", "Light Meal ($)"],
                    ["drinks", "Drinks ($)"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={draftContent.pricing[key]}
                      onChange={(e) =>
                        setDraftContent({
                          ...draftContent,
                          pricing: {
                            ...draftContent.pricing,
                            [key]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Section 3 — Responsibilities</Label>
                <textarea
                  className="mt-1 min-h-[160px] w-full rounded-2xl border border-[#AEB6C2]/60 p-4 text-sm"
                  value={draftContent.responsibilities}
                  onChange={(e) =>
                    setDraftContent({ ...draftContent, responsibilities: e.target.value })
                  }
                />
              </div>
            </Card>

            <Card className="rounded-[20px] p-6">
              <h3 className="mb-4 font-semibold" style={{ color: ADMIN_NAVY }}>
                Preview
              </h3>
              <AgreementPreview content={draftContent} versionLabel={draftLabel} showSignatureBlock />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-[20px] p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#AEB6C2]/60 text-left text-[#AEB6C2]">
                  <th className="p-4">Version</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Effective</th>
                  <th className="p-4">Expires</th>
                  <th className="p-4">Published</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr
                    key={v.id}
                    className="cursor-pointer border-b border-[#AEB6C2]/30 hover:bg-[#F7F8FB]"
                    onClick={() => setSelectedVersionId(v.id)}
                  >
                    <td className="p-4 font-medium" style={{ color: ADMIN_NAVY }}>
                      {v.versionLabel} (#{v.versionNumber})
                    </td>
                    <td className="p-4">{v.status}</td>
                    <td className="p-4">{new Date(v.effectiveDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4">
                      {v.publishedAt ? new Date(v.publishedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>

      {previewRecord ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[20px] p-6">
            <h3 className="text-lg font-bold" style={{ color: ADMIN_NAVY }}>
              Agreement Record
            </h3>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Parent:</strong> {previewRecord.parentName}
              </p>
              <p>
                <strong>Students:</strong> {previewRecord.students.join(", ")}
              </p>
              <p>
                <strong>Version:</strong> {previewRecord.versionLabel}
              </p>
              <p>
                <strong>Signed:</strong>{" "}
                {previewRecord.signedAt
                  ? new Date(previewRecord.signedAt).toLocaleString()
                  : "Not signed"}
              </p>
              <p>
                <strong>IP:</strong> {previewRecord.ipAddress ?? "Not logged"}
              </p>
              <p>
                <strong>Status:</strong> {previewRecord.status}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setPreviewRecord(null)}>
                Close
              </Button>
              <Button onClick={() => exportRecordPdf(previewRecord)}>Export PDF</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
