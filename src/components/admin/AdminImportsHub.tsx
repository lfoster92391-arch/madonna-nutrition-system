"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AdminStaffManager } from "@/components/admin/AdminStaffManager"
import { AdminStudentManager } from "@/components/admin/AdminStudentManager"
import { DesktopOnly } from "@/components/admin/DesktopOnly"
import { FamilyImportWizard } from "@/components/admin/FamilyImportWizard"
import { StaffImportWizard } from "@/components/admin/StaffImportWizard"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const VALID_TABS = new Set(["students", "families", "staff"])

export function AdminImportsHub() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const initialTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "students"
  const [tab, setTab] = useState(initialTab)
  const familyImportRef = useRef<HTMLDivElement>(null)
  const staffImportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tabParam && VALID_TABS.has(tabParam)) {
      setTab(tabParam)
    }
  }, [tabParam])

  function scrollToFamilyImport() {
    familyImportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function scrollToStaffImport() {
    staffImportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="w-full px-6 py-8 md:px-8">
      <div className="mx-auto max-w-full space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-silver-foreground">
            Setup
          </p>
          <h1 className="text-3xl font-bold text-primary">Students &amp; Imports</h1>
          <p className="text-silver-foreground">
            Add or import students, edit details and photos, add money to lunch accounts, and create
            parent or staff accounts
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Students (SIS)</TabsTrigger>
            <TabsTrigger value="families">Parents &amp; Family Accounts</TabsTrigger>
            <TabsTrigger value="staff">Staff Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-8">
            <AdminStudentManager importsTab />
          </TabsContent>

          <TabsContent value="families" className="space-y-6">
            <div className="hidden justify-end md:flex">
              <ImportExportMenu type="families" onImport={scrollToFamilyImport} />
            </div>
            <DesktopOnly>
              <div ref={familyImportRef}>
                <FamilyImportWizard />
              </div>
            </DesktopOnly>
          </TabsContent>

          <TabsContent value="staff" className="space-y-8">
            <AdminStaffManager onImportClick={scrollToStaffImport} />
            <div className="hidden justify-end md:flex">
              <ImportExportMenu type="staff" onImport={scrollToStaffImport} />
            </div>
            <DesktopOnly message="Staff bulk import is available on desktop. Open this page on a computer to upload CSV files.">
              <div ref={staffImportRef} id="staff-import">
                <StaffImportWizard />
              </div>
            </DesktopOnly>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
