"use client"

import { useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Papa from "papaparse"
import { Building2, Pencil, Plus, Trash2, Truck, Upload } from "lucide-react"
import { ReceivingStudio } from "@/components/operations/ReceivingStudio"
import { useAuth } from "@/components/providers/AuthProvider"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api/client"
import type { VendorRecord } from "@/lib/procurement/vendors"

async function fetchVendors(): Promise<VendorRecord[]> {
  const res = await fetch("/api/vendors")
  if (!res.ok) throw new Error("Failed to load vendors")
  return res.json()
}

export function ProcurementManager() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    category: "",
  })
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to create vendor")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendors"] })
      setShowAdd(false)
      setEditingId(null)
      setForm({ name: "", contactName: "", email: "", phone: "", category: "" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to update vendor")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendors"] })
      setShowAdd(false)
      setEditingId(null)
      setForm({ name: "", contactName: "", email: "", phone: "", category: "" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to deactivate vendor")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendors"] })
    },
  })

  function startEdit(vendor: VendorRecord) {
    setEditingId(vendor.id)
    setShowAdd(false)
    setForm({
      name: vendor.name,
      contactName: vendor.contactName ?? "",
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      category: vendor.category ?? "",
    })
  }

  function cancelForm() {
    setShowAdd(false)
    setEditingId(null)
    setForm({ name: "", contactName: "", email: "", phone: "", category: "" })
  }

  const exportRows = useMemo(
    () =>
      vendors.map((v) => ({
        name: v.name,
        contactName: v.contactName ?? "",
        email: v.email ?? "",
        phone: v.phone ?? "",
        category: v.category ?? "",
      })),
    [vendors]
  )

  const handleImport = (file: File) => {
    if (!user?.id) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const summary = await api.adminImportVendors({
            adminUserId: user.id,
            rows: results.data.map((row) => ({
              name: row.name ?? row["Vendor Name"] ?? "",
              contactName: row.contactName ?? row["Contact Name"] ?? "",
              email: row.email ?? row.Email ?? "",
              phone: row.phone ?? row.Phone ?? "",
              category: row.category ?? row.Category ?? "",
            })),
          })
          setImportMessage(
            `Created ${summary.created}, updated ${summary.updated}, ${summary.errors.length} errors.`
          )
          void queryClient.invalidateQueries({ queryKey: ["vendors"] })
        } catch (error) {
          setImportMessage(error instanceof Error ? error.message : "Import failed")
        }
      },
    })
  }

  return (
    <AdminModulePage
      section="Operations"
      title="Procurement"
      description="Manage food-service vendors, purchase receiving, and inventory intake."
      icon={Truck}
      headerActions={
        <ImportExportMenu
          type="vendors"
          onImport={() => fileRef.current?.click()}
          exportRows={exportRows}
        />
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImport(file)
          e.target.value = ""
        }}
      />

      <Tabs defaultValue="vendors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="receiving">Receiving</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>

          {importMessage && (
            <p className="rounded-xl border border-silver/60 bg-silver/10 px-4 py-2 text-sm">
              {importMessage}
            </p>
          )}

          {showAdd || editingId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingId ? "Edit vendor" : "New vendor"}
                </CardTitle>
              </CardHeader>
              <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Contact</Label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={() =>
                      editingId
                        ? updateMutation.mutate(editingId)
                        : createMutation.mutate()
                    }
                    disabled={
                      !form.name.trim() ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                  >
                    Save
                  </Button>
                  <Button variant="ghost" onClick={cancelForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Vendor directory
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto px-6 pb-6">
              {isLoading ? (
                <p className="text-sm text-silver-foreground">Loading vendors…</p>
              ) : vendors.length === 0 ? (
                <p className="text-sm text-silver-foreground">
                  No vendors yet. Add one manually or import the CSV template.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-silver-foreground">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Contact</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Phone</th>
                      <th className="pb-3 pr-4">Category</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b border-silver/40">
                        <td className="py-3 pr-4 font-medium">{vendor.name}</td>
                        <td className="py-3 pr-4">{vendor.contactName ?? "—"}</td>
                        <td className="py-3 pr-4">{vendor.email ?? "—"}</td>
                        <td className="py-3 pr-4">{vendor.phone ?? "—"}</td>
                        <td className="py-3 pr-4">{vendor.category ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={vendor.active ? "success" : "danger"}>
                            {vendor.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(vendor)}
                              disabled={!vendor.active}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Deactivate ${vendor.name}? They will be hidden from receiving lists.`
                                  )
                                ) {
                                  deleteMutation.mutate(vendor.id)
                                }
                              }}
                              disabled={!vendor.active || deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="receiving">
          <ReceivingStudio />
        </TabsContent>
      </Tabs>
    </AdminModulePage>
  )
}
