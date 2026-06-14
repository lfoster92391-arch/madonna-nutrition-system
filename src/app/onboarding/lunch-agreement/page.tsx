"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function LunchAgreementPage() {
  const [signed, setSigned] = useState(false)
  const [guardianName, setGuardianName] = useState("")
  const [studentName, setStudentName] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!guardianName.trim() || !studentName.trim()) return
    setSigned(true)
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Onboarding</p>
          <h1 className="mt-1 text-3xl font-bold text-primary">Lunch Program Agreement</h1>
          <p className="mt-2 text-silver-foreground">
            Required acknowledgment before participating in Madonna cafeteria services.
          </p>
        </div>

        {signed ? (
          <Card className="border-success/30 bg-success/5 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <CardHeader>
              <CardTitle className="text-success">Agreement Recorded</CardTitle>
            </CardHeader>
            <p className="text-silver-foreground">
              Thank you, {guardianName}. {studentName}&apos;s lunch program enrollment is acknowledged.
            </p>
            <Button asChild className="mt-6">
              <Link href="/parent">Go to Parent Portal</Link>
            </Button>
          </Card>
        ) : (
          <Card className="p-8">
            <div className="space-y-4 text-sm leading-relaxed text-primary">
              <p>
                By enrolling in the Madonna Nutrition Management System, guardians agree to maintain
                accurate allergy and dietary information, keep cafeteria accounts funded, and review
                low-balance notifications promptly.
              </p>
              <p>
                The school will make reasonable efforts to accommodate documented dietary needs.
                Meal charges are posted at the cafeteria kiosk and visible in the parent portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-primary">Guardian Name</label>
                <input
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="mt-1 flex h-14 w-full rounded-2xl border border-silver/80 px-4 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-primary">Student Name</label>
                <input
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="mt-1 flex h-14 w-full rounded-2xl border border-silver/80 px-4 outline-none focus:border-primary"
                />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" required className="mt-1" />
                <span>I agree to the cafeteria policies and authorize meal charges to my student account.</span>
              </label>
              <Button type="submit" className="w-full">
                Sign Agreement
              </Button>
            </form>
          </Card>
        )}
      </div>
    </main>
  )
}
