"use client"

import { useRef } from "react"
import { AdminStudentManager } from "@/components/admin/AdminStudentManager"
import { FamilyImportWizard } from "@/components/admin/FamilyImportWizard"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AdminImportsHub() {
  const familyImportRef = useRef<HTMLDivElement>(null)

  function scrollToFamilyImport() {
    familyImportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="w-full px-6 py-8 md:px-8">
      <div className="mx-auto max-w-full space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-silver-foreground">
            Launch
          </p>
          <h1 className="text-3xl font-bold text-primary">Imports</h1>
          <p className="text-silver-foreground">
            Import students from SIS and create parent &amp; family accounts
          </p>
        </div>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Students (SIS)</TabsTrigger>
            <TabsTrigger value="families">Parents &amp; Family Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-8">
            <AdminStudentManager importsTab />
          </TabsContent>

          <TabsContent value="families" className="space-y-6">
            <div className="flex justify-end">
              <ImportExportMenu type="families" onImport={scrollToFamilyImport} />
            </div>
            <div ref={familyImportRef}>
              <FamilyImportWizard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
