"use client"

import { use, useMemo, useState } from "react"
import Image from "next/image"
import { notFound, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { AnnualReviewBanner } from "@/components/parent/AnnualReviewBanner"
import { DietaryFormStatusCard } from "@/components/parent/DietaryFormStatusCard"
import { FoodSafetyCenterForm } from "@/components/parent/FoodSafetyCenterForm"
import { ParentBackLink } from "@/components/parent/ParentBackLink"
import { StudentMealsTab } from "@/components/parent/meals/StudentMealsTab"
import { StudentTransactionsTab } from "@/components/parent/meals/StudentTransactionsTab"
import { StudentBalanceAlertSection } from "@/components/parent/student-profile/StudentBalanceAlertSection"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingSubmission } from "@/data/demo"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = use(params)
  const { user } = useAuth()
  const { students, studentProfiles, allergySubmissions, updateParentContact } = useDemo()
  const { students: linkedStudents } = useParentLinkedStudents()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "dietary" ? "dietary" : "overview"

  const linkedIds = new Set(linkedStudents.map((s) => s.id))
  const student = useMemo(
    () => students.find((s) => s.id === studentId && linkedIds.has(s.id)),
    [students, studentId, linkedIds]
  )

  const profile = studentProfiles.find((p) => p.studentId === studentId)
  const pendingSubmission = getPendingSubmission(studentId, allergySubmissions)

  const [contact, setContact] = useState({
    name: student?.parentContacts[0]?.name ?? user?.displayName ?? "",
    email: student?.parentContacts[0]?.email ?? user?.email ?? "",
    phone: student?.parentContacts[0]?.phone ?? "",
  })
  const [contactSaved, setContactSaved] = useState(false)

  if (!student) notFound()

  function saveContact() {
    updateParentContact(studentId, contact)
    setContactSaved(true)
    setTimeout(() => setContactSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="border-b border-silver/40 bg-white px-4 py-6 sm:px-8">
        <ParentBackLink className="mb-4 min-h-11 items-center text-base" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Student Profile</p>
        <h1 className="mt-1 text-2xl font-bold text-primary">
          {student.firstName} {student.lastName}
        </h1>
        <p className="mt-0.5 text-xs font-medium tracking-wide text-silver-foreground">
          MD ID {student.id}
        </p>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 p-8">
        <AnnualReviewBanner
          profiles={profile ? [profile] : []}
          studentName={`${student.firstName} ${student.lastName}`}
          profileHref={`/parent/student-profile/${studentId}?tab=dietary`}
          allergySubmissions={allergySubmissions}
        />

        <Tabs defaultValue={defaultTab}>
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="dietary">Dietary &amp; Food Allergy</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <DietaryFormStatusCard
                studentId={studentId}
                studentName={`${student.firstName} ${student.lastName}`}
                profile={profile}
                pendingSubmission={pendingSubmission}
              />
            <Card className="rounded-[20px] p-8 shadow-sm">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <Image
                  src={student.photo}
                  alt={student.firstName}
                  width={140}
                  height={140}
                  className="rounded-[20px] border-2 border-silver/60 object-cover"
                />
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-silver-foreground">Full Name</p>
                      <p className="text-lg font-semibold text-primary">
                        {student.firstName} {student.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-silver-foreground">MD ID</p>
                      <p className="font-mono text-sm font-semibold text-primary">{student.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-silver-foreground">Grade</p>
                      <p className="text-lg font-semibold text-primary">{student.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-silver-foreground">Homeroom</p>
                      <p className="text-lg font-semibold text-primary">{student.homeroom ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <StudentBalanceAlertSection studentId={studentId} balance={student.balance} />

              <div className="mt-8 border-t border-silver/40 pt-8">
                <h3 className="mb-4 text-lg font-bold text-primary">Parent Contact Information</h3>
                <p className="mb-4 text-sm text-silver-foreground">Editable fields only.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={contact.phone}
                      onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <Button onClick={saveContact} className="min-h-12">
                    Save Contact Info
                  </Button>
                  {contactSaved && (
                    <span className="text-sm font-medium text-success">Saved successfully</span>
                  )}
                </div>
              </div>
            </Card>
            </div>
          </TabsContent>

          <TabsContent value="meals">
            <StudentMealsTab
              studentId={studentId}
              studentName={`${student.firstName} ${student.lastName}`}
            />
          </TabsContent>

          <TabsContent value="dietary">
            <FoodSafetyCenterForm
              student={student}
              profile={profile}
              submittedBy={user?.displayName ?? "Parent"}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <StudentTransactionsTab
              studentId={studentId}
              studentName={`${student.firstName} ${student.lastName}`}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
