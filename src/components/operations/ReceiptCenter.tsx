"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FileText, Receipt, Upload } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReceiptScan, ReceivingRecord } from "@/lib/operations/types"

interface ReceiptsData {
  source: string
  scans: ReceiptScan[]
  receiving: ReceivingRecord[]
}

const STATUS_VARIANT: Record<string, "default" | "warning" | "success"> = {
  pending: "default",
  unmatched: "warning",
  matched: "success",
}

async function fetchReceipts(): Promise<ReceiptsData> {
  const res = await fetch("/api/receipts")
  if (!res.ok) throw new Error("Failed to load receipts")
  return res.json()
}

export function ReceiptCenter() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null)
  const [matchReceivingId, setMatchReceivingId] = useState("")
  const [ocrPreview, setOcrPreview] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ["receipts"], queryFn: fetchReceipts })

  const uploadMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      })
      if (!res.ok) throw new Error("Upload failed")
      return res.json()
    },
    onSuccess: (result) => {
      setOcrPreview(result.ocrText ?? null)
      void queryClient.invalidateQueries({ queryKey: ["receipts"] })
    },
  })

  const matchMutation = useMutation({
    mutationFn: async (payload: { id: string; receivingId: string; approve?: boolean }) => {
      const res = await fetch("/api/receipts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Match failed")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["receipts"] })
      void queryClient.invalidateQueries({ queryKey: ["receiving"] })
      void queryClient.invalidateQueries({ queryKey: ["inventory"] })
      setSelectedScanId(null)
      setMatchReceivingId("")
    },
  })

  const scans = data?.scans ?? []
  const receiving = data?.receiving ?? []
  const unmatched = scans.filter((r) => r.status === "unmatched" || r.status === "pending").length
  const selectedScan = scans.find((s) => s.id === selectedScanId)

  const pendingReceiving = receiving.filter(
    (r) => r.status === "pending_approval" || r.status === "draft"
  )

  return (
    <AdminModulePage
      section="Operations"
      title="Receipt Center"
      description="Scan and upload receipts, OCR stub parsing, match to receiving, and approve."
      icon={Receipt}
      stats={[
        { label: "Unmatched", value: String(unmatched), variant: unmatched ? "warning" : "success" },
        { label: "Total Scans", value: String(scans.length) },
        { label: "Mode", value: "Live" },
      ]}
    >
      {isLoading && <p className="text-silver-foreground">Loading receipt inbox…</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Receipt Inbox</CardTitle>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMutation.mutate(file.name)
                }}
              />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </Button>
            </CardHeader>
            <div className="space-y-3">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className={`flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                    selectedScanId === scan.id ? "border-primary bg-primary/5" : "border-silver/40"
                  }`}
                  onClick={() => setSelectedScanId(scan.id)}
                >
                  <div>
                    <p className="font-semibold text-primary">{scan.fileName}</p>
                    {scan.vendorGuess && (
                      <p className="text-sm text-silver-foreground">Vendor: {scan.vendorGuess}</p>
                    )}
                    {scan.matchedReceivingId && (
                      <p className="text-xs text-success">Matched to {scan.matchedReceivingId}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_VARIANT[scan.status] ?? "default"}>{scan.status}</Badge>
                    <span className="text-xs text-silver-foreground">
                      {new Date(scan.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> OCR Preview (Stub)
              </CardTitle>
            </CardHeader>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-silver/10 p-4 text-xs text-silver-foreground">
              {ocrPreview ??
                (selectedScan
                  ? `[OCR Stub] Parsed ${selectedScan.fileName}\nVendor: ${selectedScan.vendorGuess ?? "Unknown"}\nStatus: ${selectedScan.status}`
                  : "Upload or select a receipt to preview OCR output.")}
            </pre>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Match & Approve</CardTitle>
            </CardHeader>
            <div className="space-y-3 px-6 pb-6">
              <p className="text-sm text-silver-foreground">
                {selectedScan
                  ? `Selected: ${selectedScan.fileName}`
                  : "Select a receipt from the inbox"}
              </p>
              <label className="text-sm">
                Receiving record
                <select
                  className="mt-1 w-full rounded-xl border border-silver/60 px-3 py-2"
                  value={matchReceivingId}
                  onChange={(e) => setMatchReceivingId(e.target.value)}
                  disabled={!selectedScanId}
                >
                  <option value="">Select receiving…</option>
                  {pendingReceiving.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.vendorName} — {r.invoiceNumber ?? r.id}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                className="w-full"
                disabled={!selectedScanId || !matchReceivingId || matchMutation.isPending}
                onClick={() =>
                  matchMutation.mutate({
                    id: selectedScanId!,
                    receivingId: matchReceivingId,
                  })
                }
              >
                Match Receipt
              </Button>
              <Button
                className="w-full"
                variant="outline"
                disabled={!selectedScanId || !matchReceivingId || matchMutation.isPending}
                onClick={() =>
                  matchMutation.mutate({
                    id: selectedScanId!,
                    receivingId: matchReceivingId,
                    approve: true,
                  })
                }
              >
                Match & Approve Receiving
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminModulePage>
  )
}
