"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, MessageSquare, XCircle } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { getChangeDiff, payloadToAllergies } from "@/lib/food-safety"
import type { AllergySubmission } from "@/lib/types"

export default function AllergyReviewPage() {
  const { students, allergySubmissions, reviewAllergySubmission } = useDemo()
  const [toast, setToast] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  const queue = useMemo(
    () =>
      allergySubmissions.filter(
        (s) => s.status === "pending_review" || s.status === "clarification_requested"
      ),
    [allergySubmissions]
  )

  const rows = useMemo(() => {
    return queue.flatMap((submission) => {
      const student = students.find((s) => s.id === submission.studentId)
      const newAllergies = payloadToAllergies(submission.changePayload)
      const diffs = getChangeDiff(
        student?.allergies ?? [],
        newAllergies,
        student?.dietaryRestrictions ?? [],
        submission.changePayload.dietaryRestrictions
      )
      return diffs.map((diff, i) => ({
        key: `${submission.id}-${i}`,
        submission,
        student,
        ...diff,
      }))
    })
  }, [queue, students])

  function handleAction(
    submission: AllergySubmission,
    action: "approve" | "reject" | "clarification"
  ) {
    const note = reviewNotes[submission.id]
    reviewAllergySubmission(submission.id, action, "Nutrition Office", note)

    const messages = {
      approve: "Profile approved. Student allergies updated and staff notified.",
      reject: "Submission rejected. Parent will be notified.",
      clarification: "Clarification requested. Parent notified via demo toast.",
    }
    setToast(messages[action])
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Allergy Review Queue</h1>
          <p className="text-silver-foreground">
            Review parent-submitted food safety profiles before they appear at scan stations.
          </p>
        </div>

        {toast && (
          <div className="rounded-2xl border border-success/40 bg-success/10 px-6 py-4 font-medium text-success">
            {toast}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Pending Submissions ({queue.length})
            </CardTitle>
          </CardHeader>

          {rows.length === 0 ? (
            <p className="px-6 pb-6 text-silver-foreground">No submissions awaiting review.</p>
          ) : (
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-silver/60 text-silver-foreground">
                    <th className="pb-3 pr-4 text-left font-medium">Student</th>
                    <th className="pb-3 pr-4 text-left font-medium">Submitted By</th>
                    <th className="pb-3 pr-4 text-left font-medium">Change Type</th>
                    <th className="pb-3 pr-4 text-left font-medium">Old Value</th>
                    <th className="pb-3 pr-4 text-left font-medium">New Value</th>
                    <th className="pb-3 pr-4 text-left font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-b border-silver/30">
                      <td className="py-4 pr-4 font-medium text-primary">
                        {row.student
                          ? `${row.student.firstName} ${row.student.lastName}`
                          : row.submission.studentId}
                      </td>
                      <td className="py-4 pr-4">{row.submission.submittedBy}</td>
                      <td className="py-4 pr-4">{row.changeType}</td>
                      <td className="py-4 pr-4 max-w-[180px] truncate text-silver-foreground">
                        {row.oldValue}
                      </td>
                      <td className="py-4 pr-4 max-w-[180px] truncate font-medium">
                        {row.newValue}
                      </td>
                      <td className="py-4 pr-4">
                        <Badge
                          variant={
                            row.submission.status === "pending_review" ? "warning" : "default"
                          }
                        >
                          {row.submission.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAction(row.submission, "approve")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(row.submission, "reject")}
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction(row.submission, "clarification")}
                            >
                              <MessageSquare className="h-4 w-4" />
                              Clarify
                            </Button>
                          </div>
                          <div className="w-full max-w-xs">
                            <Label className="text-xs">Note to parent (optional)</Label>
                            <Input
                              className="h-10 text-xs"
                              placeholder="Review note..."
                              value={reviewNotes[row.submission.id] ?? ""}
                              onChange={(e) =>
                                setReviewNotes((n) => ({
                                  ...n,
                                  [row.submission.id]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
