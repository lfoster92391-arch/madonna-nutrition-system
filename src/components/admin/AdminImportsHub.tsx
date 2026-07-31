"use client"

import { useRef } from "react"
import { AdminStudentManager } from "@/components/admin/AdminStudentManager"
import { DesktopOnly } from "@/components/admin/DesktopOnly"
import { FamilyImportWizard } from "@/components/admin/FamilyImportWizard"
import { StaffImportWizard } from "@/components/admin/StaffImportWizard"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AdminImportsHub() {
  const familyImportRef = useRef<HTMLDivElement>(null)
  const staffImportRef = useRef<HTMLDivElement>(null)

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
            Students
          </p>
          <h1 className="text-3xl font-bold text-primary">Import students &amp; accounts</h1>
          <p className="max-w-2xl text-silver-foreground">
            Simple steps: pick a file → check the rows → import. Start with students, then parents, then staff.
          </p>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">1. Students</TabsTrigger>
            <TabsTrigger value="families">2. Parents</TabsTrigger>
            <TabsTrigger value="staff">3. Staff</TabsTrigger>
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

          <TabsContent value="staff" className="space-y-6">
            <div className="hidden justify-end md:flex">
              <ImportExportMenu type="staff" onImport={scrollToStaffImport} />
            </div>
            <DesktopOnly message="Staff bulk import is available on desktop. Open this page on a computer to upload CSV files.">
              <div ref={staffImportRef}>
                <StaffImportWizard />
              </div>
            </DesktopOnly>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
