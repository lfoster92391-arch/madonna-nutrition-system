"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { AgreementPreview } from "@/components/agreements/AgreementPreview"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { DEFAULT_AGREEMENT_CONTENT, DEFAULT_PUBLISHED_VERSION } from "@/config/agreement-defaults"
import { AGREEMENT_STATUS_CHANGED_EVENT } from "@/components/agreements/useAgreementStatus"
import { signDemoAgreement } from "@/lib/agreements/demo-store"
import type { AgreementContent } from "@/config/agreement-defaults"
import type { AgreementVersionDto } from "@/lib/agreements/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ParentAgreementSigningPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [version, setVersion] = useState<AgreementVersionDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signed, setSigned] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)

  const [parentName, setParentName] = useState(user?.displayName ?? "")
  const [relationship, setRelationship] = useState("Parent/Guardian")
  const [typedSignature, setTypedSignature] = useState("")
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    async function load() {
      if (!databaseEnabled) {
        setVersion(DEFAULT_PUBLISHED_VERSION as AgreementVersionDto)
        setLoading(false)
        return
      }
      try {
        const res = await fetch("/api/agreements/current")
        const data = await res.json()
        setVersion(data)
      } catch {
        setVersion(DEFAULT_PUBLISHED_VERSION as AgreementVersionDto)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [databaseEnabled])

  const content: AgreementContent = useMemo(
    () => version?.content ?? DEFAULT_AGREEMENT_CONTENT,
    [version]
  )

  const signatureMatches =
    typedSignature.trim().toLowerCase() === parentName.trim().toLowerCase() &&
    typedSignature.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id || !accepted || !signatureMatches) return
    setSubmitting(true)
    setError(null)

    try {
      if (!databaseEnabled) {
        const result = signDemoAgreement({
          parentUserId: user.id,
          parentName: parentName.trim(),
          relationship: relationship.trim(),
          typedSignature: typedSignature.trim(),
        })
        setReceipt(
          `Signed ${result.versionLabel} for ${result.studentNames.join(", ")} on ${new Date(result.signedAt ?? "").toLocaleString()}`
        )
        window.dispatchEvent(new Event(AGREEMENT_STATUS_CHANGED_EVENT))
        setSigned(true)
        return
      }

      const res = await fetch("/api/agreements/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentUserId: user.id,
          parentName: parentName.trim(),
          relationship: relationship.trim(),
          typedSignature: typedSignature.trim(),
          acceptedTerms: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Unable to sign agreement")
      }
      setReceipt(data.receipt?.message ?? "Agreement signed successfully.")
      window.dispatchEvent(new Event(AGREEMENT_STATUS_CHANGED_EVENT))
      setSigned(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign agreement")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-[#AEB6C2]">Loading cafeteria agreement...</p>
      </div>
    )
  }

  if (signed) {
    return (
      <main className="min-h-screen bg-white p-6 sm:p-10">
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-[20px] border-[#00A83E]/30 bg-[#00A83E]/5 p-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#00A83E]" />
            <h1 className="mt-4 text-2xl font-bold text-[#041B52]">Agreement Signed</h1>
            <p className="mt-2 text-[#AEB6C2]">{receipt}</p>
            <p className="mt-4 text-sm text-[#64748B]">
              A confirmation receipt has been recorded. You may now access lunch enrollment.
            </p>
            <Button className="mt-8" onClick={() => router.replace("/parent")}>
              Continue to Parent Portal
            </Button>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="border-b border-[#C8CDD7] bg-[#041B52] px-6 py-8 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8CDD7]">Fuel The Dons</p>
        <h1 className="mt-1 text-3xl font-bold">Cafeteria Agreement</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#C8CDD7]">
          You must complete this digital agreement before lunch enrollment. This screen cannot be
          dismissed until signed.
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 p-6 sm:p-10">
        <AgreementPreview content={content} versionLabel={version?.versionLabel} />

        <section className="space-y-4 rounded-[20px] border border-[#AEB6C2]/60 p-6">
          <h3 className="text-lg font-semibold text-[#041B52]">Section 4 — Digital Signature</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="parentName">Parent Full Name</Label>
                <Input
                  id="parentName"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="relationship">Relationship to Student</Label>
                <Input
                  id="relationship"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="signDate">Date</Label>
              <Input
                id="signDate"
                readOnly
                value={new Date().toLocaleDateString()}
                className="mt-1 bg-[#F7F8FB]"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-[#041B52]">
              <input
                type="checkbox"
                required
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1"
              />
              <span>
                I have read and agree to the Fuel The Dons cafeteria policies, pricing, and
                responsibilities outlined above.
              </span>
            </label>

            <div>
              <Label htmlFor="typedSignature">Type your full name to confirm</Label>
              <Input
                id="typedSignature"
                required
                placeholder="Must match Parent Full Name exactly"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                className="mt-1"
              />
              {!signatureMatches && typedSignature.length > 0 ? (
                <p className="mt-1 text-xs text-[#D62828]">
                  Typed signature must exactly match Parent Full Name.
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="rounded-xl border border-[#D62828]/30 bg-[#D62828]/10 px-4 py-3 text-sm text-[#D62828]">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !accepted || !signatureMatches}
            >
              {submitting ? "Signing..." : "Sign & Continue"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
