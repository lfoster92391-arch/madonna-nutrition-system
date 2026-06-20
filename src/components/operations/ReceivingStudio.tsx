"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Barcode, PackageCheck, Upload } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { OpsInventoryItem, ReceivingRecord, StorageLocation } from "@/lib/operations/types"

interface ReceivingData {
  source: string
  records: ReceivingRecord[]
  storageLocations: StorageLocation[]
  inventory: OpsInventoryItem[]
}

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "danger"> = {
  draft: "default",
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
}

async function fetchReceiving(): Promise<ReceivingData> {
  const res = await fetch("/api/receiving")
  if (!res.ok) throw new Error("Failed to load receiving data")
  return res.json()
}

export function ReceivingStudio() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState("")
  const [scanResult, setScanResult] = useState<OpsInventoryItem | null>(null)
  const [vendorName, setVendorName] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [itemName, setItemName] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unit, setUnit] = useState("ea")
  const [storageLocationId, setStorageLocationId] = useState("")
  const [notes, setNotes] = useState("")
  const [filter, setFilter] = useState<"all" | "pending_approval" | "approved" | "draft">("all")

  const { data, isLoading } = useQuery({ queryKey: ["receiving"], queryFn: fetchReceiving })

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["receiving"] })
    void queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create receiving record")
      return res.json()
    },
    onSuccess: invalidate,
  })

  const patchMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/receiving", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update receiving record")
      return res.json()
    },
    onSuccess: invalidate,
  })

  const handleBarcodeScan = async () => {
    if (!barcode.trim()) return
    const res = await fetch(`/api/receiving?barcode=${encodeURIComponent(barcode.trim())}`)
    const json = await res.json()
    setScanResult(json.item ?? null)
    if (json.item) {
      setItemName(json.item.name)
      setUnit(json.item.unit)
    }
  }

  const handleManualReceive = () => {
    if (!vendorName.trim() || !itemName.trim()) return
    createMutation.mutate({
      vendorName: vendorName.trim(),
      invoiceNumber: invoiceNumber.trim() || undefined,
      storageLocationId: storageLocationId || undefined,
      notes: notes.trim() || undefined,
      status: "pending_approval",
      lines: [
        {
          inventoryItemId: scanResult?.id,
          name: itemName.trim(),
          quantity: Number(quantity) || 1,
          unit: unit.trim() || "ea",
        },
      ],
      barcode: barcode.trim() || undefined,
    })
    setVendorName("")
    setInvoiceNumber("")
    setItemName("")
    setQuantity("1")
    setNotes("")
    setBarcode("")
    setScanResult(null)
  }

  const handleReceiptUpload = (file: File) => {
    createMutation.mutate({
      vendorName: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      status: "pending_approval",
      notes: `Uploaded receipt: ${file.name}`,
      lines: [{ name: "Receipt line items pending OCR", quantity: 1, unit: "lot" }],
    })
  }

  const records = data?.records ?? []
  const filtered = useMemo(() => {
    if (filter === "all") return records
    return records.filter((r) => r.status === filter)
  }, [records, filter])

  const pending = records.filter((r) => r.status === "pending_approval").length

  return (
    <AdminModulePage
      section="Operations"
      title="Receiving Studio"
      description="Barcode scan, receipt upload, and manual receive — post inventory on approval."
      icon={PackageCheck}
      stats={[
        { label: "Pending Approval", value: String(pending), variant: pending ? "warning" : "success" },
        { label: "Queue Total", value: String(records.length), hint: "Live data" },
      ]}
    >
      {isLoading && <p className="text-silver-foreground">Loading receiving queue…</p>}

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Receiving Queue</TabsTrigger>
          <TabsTrigger value="scan">Barcode Scan</TabsTrigger>
          <TabsTrigger value="manual">Manual Receive</TabsTrigger>
          <TabsTrigger value="upload">Receipt Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Delivery Queue</CardTitle>
              <div className="flex flex-wrap gap-2">
                {(["all", "draft", "pending_approval", "approved"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={filter === f ? "default" : "outline"}
                    onClick={() => setFilter(f)}
                  >
                    {f.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <div className="space-y-3">
              {filtered.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-silver/40 p-4"
                >
                  <div>
                    <p className="font-semibold text-primary">{record.vendorName}</p>
                    {record.invoiceNumber && (
                      <p className="text-sm text-silver-foreground">Invoice {record.invoiceNumber}</p>
                    )}
                    <p className="mt-2 text-sm text-silver-foreground">
                      {record.lines.map((l) => `${l.quantity} ${l.unit} ${l.name}`).join(" · ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={STATUS_VARIANT[record.status] ?? "default"}>
                      {record.status.replace(/_/g, " ")}
                    </Badge>
                    {record.receivedAt && (
                      <span className="text-xs text-silver-foreground">
                        {new Date(record.receivedAt).toLocaleString()}
                      </span>
                    )}
                    {record.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchMutation.mutate({ id: record.id, action: "submit" })}
                      >
                        Submit
                      </Button>
                    )}
                    {record.status === "pending_approval" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            patchMutation.mutate({
                              id: record.id,
                              action: "approve",
                              approvedBy: "Receiving Studio",
                              storageLocationId: storageLocationId || data?.storageLocations[0]?.id,
                            })
                          }
                        >
                          Approve & Post
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => patchMutation.mutate({ id: record.id, action: "reject" })}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-silver-foreground">No records in this queue.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="scan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" /> Barcode Scan
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Scan or enter barcode…"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleBarcodeScan()}
                />
                <Button type="button" onClick={() => void handleBarcodeScan()}>
                  Lookup
                </Button>
              </div>
              {scanResult ? (
                <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
                  <p className="font-semibold text-primary">{scanResult.name}</p>
                  <p className="text-sm text-silver-foreground">
                    On hand: {scanResult.qty} {scanResult.unit} · {scanResult.category}
                  </p>
                </div>
              ) : barcode ? (
                <p className="text-sm text-warning">No matching SKU — will create on receive.</p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Default storage location
                  <select
                    className="mt-1 w-full rounded-xl border border-silver/60 px-3 py-2"
                    value={storageLocationId}
                    onChange={(e) => setStorageLocationId(e.target.value)}
                  >
                    <option value="">Select location…</option>
                    {(data?.storageLocations ?? []).map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.zone})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Receive Form</CardTitle>
            </CardHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Vendor name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
              <Input
                placeholder="Invoice # (optional)"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
              <Input placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              <div className="flex gap-2">
                <Input
                  placeholder="Qty"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Input placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
              <label className="text-sm sm:col-span-2">
                Storage location
                <select
                  className="mt-1 w-full rounded-xl border border-silver/60 px-3 py-2"
                  value={storageLocationId}
                  onChange={(e) => setStorageLocationId(e.target.value)}
                >
                  <option value="">Select location…</option>
                  {(data?.storageLocations ?? []).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.zone})
                    </option>
                  ))}
                </select>
              </label>
              <Textarea
                className="sm:col-span-2"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                className="sm:col-span-2"
                onClick={handleManualReceive}
                disabled={createMutation.isPending}
              >
                Submit for Approval
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> Receipt Upload
              </CardTitle>
            </CardHeader>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleReceiptUpload(file)
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Upload Delivery Receipt
            </Button>
            <p className="mt-3 text-sm text-silver-foreground">
              Creates a pending receiving record. Match and approve in Receipt Center.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminModulePage>
  )
}
