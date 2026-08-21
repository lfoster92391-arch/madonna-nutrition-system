"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowDown,
  ArrowUp,
  MonitorSmartphone,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { getSessionHeaders } from "@/lib/api/client"
import { formatCurrency } from "@/lib/utils"
import type { KioskPosButtonDto } from "@/lib/kiosk/pos-buttons"

type Audience = KioskPosButtonDto["audience"]
type Category = KioskPosButtonDto["category"]

type Draft = {
  label: string
  price: string
  sortOrder: string
  active: boolean
  audience: Audience
  category: Category
  grades: string
}

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "STAFF", label: "Staff" },
  { value: "BOTH", label: "Both" },
  { value: "CASHIER_ONLY", label: "Cashier only" },
]

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "MEAL", label: "Meal" },
  { value: "DRINK", label: "Drink" },
  { value: "ALA_CARTE", label: "À la carte" },
  { value: "CUSTOM", label: "Custom" },
]

function emptyDraft(): Draft {
  return {
    label: "",
    price: "1.00",
    sortOrder: "",
    active: true,
    audience: "BOTH",
    category: "CUSTOM",
    grades: "",
  }
}

function toDraft(button: KioskPosButtonDto): Draft {
  return {
    label: button.label,
    price: button.price.toFixed(2),
    sortOrder: String(button.sortOrder),
    active: button.active,
    audience: button.audience,
    category: button.category,
    grades: button.grades.join(", "),
  }
}

async function fetchButtons(): Promise<KioskPosButtonDto[]> {
  const res = await fetch("/api/admin/kiosk-pos-buttons", {
    headers: { ...getSessionHeaders() },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "Failed to load kiosk buttons")
  }
  const data = (await res.json()) as { buttons: KioskPosButtonDto[] }
  return data.buttons
}

export function KioskPosButtonsManager() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [showAdd, setShowAdd] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const { data: buttons = [], isLoading, error } = useQuery({
    queryKey: ["kiosk-pos-buttons"],
    queryFn: fetchButtons,
  })

  const sorted = useMemo(
    () => [...buttons].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [buttons]
  )

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["kiosk-pos-buttons"] })

  const saveMutation = useMutation({
    mutationFn: async (input: { id?: string; create?: boolean }) => {
      const price = Number.parseFloat(draft.price)
      if (!draft.label.trim()) throw new Error("Label is required")
      if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price")
      const grades = draft.grades
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
      const payload = {
        adminUserId: user?.id,
        label: draft.label.trim(),
        price,
        sortOrder: draft.sortOrder ? Number.parseInt(draft.sortOrder, 10) : undefined,
        active: draft.active,
        audience: draft.audience,
        category: draft.category,
        grades,
      }
      const res = input.create
        ? await fetch("/api/admin/kiosk-pos-buttons", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getSessionHeaders() },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/kiosk-pos-buttons/${input.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...getSessionHeaders() },
            body: JSON.stringify(payload),
          })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Save failed")
      }
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      setEditingId(null)
      setShowAdd(false)
      setDraft(emptyDraft())
      setMessage("Saved. Kiosk will use these buttons on the next scan.")
    },
    onError: (err: Error) => setMessage(err.message),
  })

  const patchQuick = useMutation({
    mutationFn: async (input: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/kiosk-pos-buttons/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ ...input.data, adminUserId: user?.id }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Update failed")
      }
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      setMessage(null)
    },
    onError: (err: Error) => setMessage(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/kiosk-pos-buttons/${id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Delete failed")
      }
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      setMessage("Button removed (system buttons are hidden, not deleted).")
    },
    onError: (err: Error) => setMessage(err.message),
  })

  function startEdit(button: KioskPosButtonDto) {
    setShowAdd(false)
    setEditingId(button.id)
    setDraft(toDraft(button))
    setMessage(null)
  }

  function startAdd() {
    setEditingId(null)
    setShowAdd(true)
    setDraft(emptyDraft())
    setMessage(null)
  }

  function cancelForm() {
    setEditingId(null)
    setShowAdd(false)
    setDraft(emptyDraft())
  }

  function move(button: KioskPosButtonDto, direction: -1 | 1) {
    const idx = sorted.findIndex((b) => b.id === button.id)
    const swap = sorted[idx + direction]
    if (!swap) return
    void patchQuick.mutateAsync({
      id: button.id,
      data: { sortOrder: swap.sortOrder },
    })
    void patchQuick.mutateAsync({
      id: swap.id,
      data: { sortOrder: button.sortOrder },
    })
  }

  return (
    <AdminModulePage
      section="Kiosk"
      title="Lunch kiosk buttons"
      description="Add, rename, reorder, and show or hide charge buttons on the lunch POS. Student Meal and Staff Meal prices always follow lunch rules ($7, or $1/slice on Pizza Day)."
      icon={MonitorSmartphone}
      headerActions={
        <Button type="button" onClick={startAdd} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden />
          Add button
        </Button>
      }
    >
      {message && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {(error as Error).message}
        </p>
      )}

      {(showAdd || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{showAdd ? "New charge button" : "Edit button"}</CardTitle>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="kiosk-btn-label">Label</Label>
              <Input
                id="kiosk-btn-label"
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="e.g. Cookie"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kiosk-btn-price">
                Price
                {editingId && buttons.find((b) => b.id === editingId)?.priceLocked
                  ? " (locked — lunch rules)"
                  : ""}
              </Label>
              <Input
                id="kiosk-btn-price"
                type="number"
                min={0}
                step="0.01"
                disabled={Boolean(
                  editingId && buttons.find((b) => b.id === editingId)?.priceLocked
                )}
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kiosk-btn-sort">Sort order</Label>
              <Input
                id="kiosk-btn-sort"
                type="number"
                min={0}
                value={draft.sortOrder}
                onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kiosk-btn-audience">Audience</Label>
              <select
                id="kiosk-btn-audience"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.audience}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, audience: e.target.value as Audience }))
                }
              >
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kiosk-btn-category">Category</Label>
              <select
                id="kiosk-btn-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, category: e.target.value as Category }))
                }
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kiosk-btn-grades">Grades (optional)</Label>
              <Input
                id="kiosk-btn-grades"
                value={draft.grades}
                onChange={(e) => setDraft((d) => ({ ...d, grades: e.target.value }))}
                placeholder="9, 10, 11, 12"
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
              />
              Active on kiosk
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <Button
                type="button"
                className="gap-2"
                disabled={saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    create: showAdd,
                    id: editingId ?? undefined,
                  })
                }
              >
                <Save className="h-4 w-4" aria-hidden />
                Save
              </Button>
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configured buttons</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">No buttons yet.</p>
          )}
          {sorted.map((button) => (
            <div
              key={button.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-primary">{button.label}</p>
                  <Badge variant="outline">{formatCurrency(button.price)}</Badge>
                  {!button.active && <Badge variant="warning">Hidden</Badge>}
                  {button.isSystem && <Badge>System</Badge>}
                  <Badge variant="outline">{button.audience.replace("_", " ")}</Badge>
                  <Badge variant="outline">{button.category.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Key: {button.key} · Order: {button.sortOrder}
                  {button.grades.length > 0 ? ` · Grades ${button.grades.join(", ")}` : ""}
                  {button.priceLocked ? " · Price follows lunch rules" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Move up"
                  onClick={() => move(button, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Move down"
                  onClick={() => move(button, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    patchQuick.mutate({
                      id: button.id,
                      data: { active: !button.active },
                    })
                  }
                >
                  {button.active ? "Hide" : "Show"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => startEdit(button)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-red-700"
                  onClick={() => {
                    if (
                      window.confirm(
                        button.isSystem
                          ? `Hide “${button.label}” on the kiosk? (System buttons are not permanently deleted.)`
                          : `Remove “${button.label}”?`
                      )
                    ) {
                      deleteMutation.mutate(button.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdminModulePage>
  )
}
