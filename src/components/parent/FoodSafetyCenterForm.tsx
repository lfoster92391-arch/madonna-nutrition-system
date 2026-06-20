"use client"

import { useMemo, useState } from "react"
import { AlertCircle, FileUp, Search, ShieldAlert } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckboxField } from "@/components/ui/checkbox"
import { Input, Label } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getMedicalDocumentsForStudent } from "@/lib/student-profiles"
import {
  ALLERGY_OPTIONS,
  DIETARY_OPTIONS,
  foodSafetyFormSchema,
  type FoodSafetyFormValues,
} from "@/lib/food-safety"
import type { Student, StudentProfile } from "@/lib/types"
import { cn } from "@/lib/utils"

// TODO: Replace FileReader demo upload with UploadThing when configured
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function FoodSafetyCenterForm({
  student,
  profile,
  submittedBy,
  onSubmitted,
}: {
  student: Student
  profile?: StudentProfile
  submittedBy: string
  onSubmitted?: () => void
}) {
  const { submitAllergyForm, uploadMedicalDocument, medicalDocuments, allergySubmissions } =
    useDemo()
  const pending = allergySubmissions.find(
    (s) =>
      s.studentId === student.id &&
      (s.status === "pending_review" || s.status === "clarification_requested")
  )
  const docs = getMedicalDocumentsForStudent(student.id, medicalDocuments)

  const [allergySearch, setAllergySearch] = useState("")
  const [form, setForm] = useState<FoodSafetyFormValues>({
    allergies: student.allergies.map((a) => {
      const match = ALLERGY_OPTIONS.find(
        (o) => o.toLowerCase() === a.name.toLowerCase()
      )
      return match ?? "Other"
    }),
    otherAllergyDescription: student.allergies.find(
      (a) => !ALLERGY_OPTIONS.some((o) => o.toLowerCase() === a.name.toLowerCase())
    )?.name,
    severity: student.allergies[0]?.severity ?? "moderate",
    reactionInfo: "",
    crossContact: {
      avoidSharedEquipment: false,
      traceAmountsTrigger: false,
      ingredientOnly: false,
    },
    dietaryRestrictions: student.dietaryRestrictions.filter((d) =>
      DIETARY_OPTIONS.includes(d as (typeof DIETARY_OPTIONS)[number])
    ),
    medicalNotes: profile?.medicalNotes ?? "",
    emergencyMealNotes: "",
    emergencyFoodContactName:
      profile?.emergencyFoodContactName ?? student.parentContacts[0]?.name ?? "",
    emergencyFoodContactPhone:
      profile?.emergencyFoodContactPhone ?? student.parentContacts[0]?.phone ?? "",
    consentConfirmed: false as unknown as true,
    electronicSignature: submittedBy,
    signatureDate: new Date().toISOString().slice(0, 10),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  const filteredAllergies = useMemo(() => {
    const q = allergySearch.toLowerCase()
    return ALLERGY_OPTIONS.filter((a) => a.toLowerCase().includes(q))
  }, [allergySearch])

  function toggleAllergy(allergy: string) {
    setForm((f) => ({
      ...f,
      allergies: f.allergies.includes(allergy)
        ? f.allergies.filter((a) => a !== allergy)
        : [...f.allergies, allergy],
    }))
  }

  function toggleDietary(item: string) {
    setForm((f) => ({
      ...f,
      dietaryRestrictions: f.dietaryRestrictions.includes(item)
        ? f.dietaryRestrictions.filter((d) => d !== item)
        : [...f.dietaryRestrictions, item],
    }))
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      await uploadMedicalDocument(student.id, file.name, dataUrl, submittedBy)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, consentConfirmed: form.consentConfirmed || false }
    const result = foodSafetyFormSchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".")
        fieldErrors[key] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    await submitAllergyForm(student.id, submittedBy, result.data)
    setSubmitSuccess(true)
    onSubmitted?.()
  }

  if (pending && !submitSuccess) {
    return (
      <Card className="rounded-[20px] border-warning/40 bg-warning/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-warning" />
        <h3 className="mt-4 text-xl font-bold text-primary">Pending Review</h3>
        <p className="mt-2 text-silver-foreground">
          Your submission is awaiting review by the Nutrition Office. Changes will not take
          effect until approved.
        </p>
        <p className="mt-4 text-sm text-silver-foreground">
          Submitted {new Date(pending.createdAt).toLocaleString()}
        </p>
      </Card>
    )
  }

  if (submitSuccess) {
    return (
      <Card className="rounded-[20px] border-success/40 bg-success/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-success" />
        <h3 className="mt-4 text-xl font-bold text-primary">Submitted for Review</h3>
        <p className="mt-2 text-silver-foreground">
          Your food safety profile has been submitted. The Nutrition Office will review and
          approve before cafeteria staff are notified.
        </p>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-[20px] border border-primary/20 bg-primary/5 px-6 py-5">
        <h2 className="text-2xl font-bold text-primary">Dietary &amp; Food Allergy Form</h2>
        <p className="mt-1 text-lg text-silver-foreground">
          Required for every student. Must be reviewed annually or when the school requests an update.
        </p>
      </div>

      {/* Allergy Selection */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-primary">Allergy Selection</h3>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-silver-foreground" />
          <Input
            className="pl-12"
            placeholder="Search allergies..."
            value={allergySearch}
            onChange={(e) => setAllergySearch(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredAllergies.map((allergy) => (
            <CheckboxField
              key={allergy}
              id={`allergy-${allergy}`}
              label={allergy}
              checked={form.allergies.includes(allergy)}
              onCheckedChange={() => toggleAllergy(allergy)}
            />
          ))}
        </div>
        {form.allergies.includes("Other") && (
          <div className="mt-4">
            <Label>Describe allergy</Label>
            <Input
              value={form.otherAllergyDescription ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, otherAllergyDescription: e.target.value }))
              }
              placeholder="Describe the allergy..."
            />
            {errors.otherAllergyDescription && (
              <p className="mt-1 text-sm text-danger">{errors.otherAllergyDescription}</p>
            )}
          </div>
        )}
      </section>

      {/* Severity */}
      <section>
        <h3 className="mb-2 text-lg font-bold text-primary">
          Severity <span className="text-danger">*</span>
        </h3>
        <p className="mb-4 text-sm text-silver-foreground">This affects cafeteria alerts.</p>
        <div className="grid gap-3">
          {(
            [
              { value: "severe", label: "Severe (Anaphylaxis Risk)" },
              { value: "moderate", label: "Moderate" },
              { value: "informational", label: "Mild / Informational" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3",
                form.severity === value
                  ? "border-primary bg-primary/5"
                  : "border-silver/60 bg-white"
              )}
            >
              <input
                type="radio"
                name="severity"
                value={value}
                checked={form.severity === value}
                onChange={() => setForm((f) => ({ ...f, severity: value }))}
                className="h-5 w-5 accent-primary"
              />
              <span className="text-base font-medium text-primary">{label}</span>
            </label>
          ))}
        </div>
        {errors.severity && <p className="mt-1 text-sm text-danger">{errors.severity}</p>}
      </section>

      {/* Reaction Information */}
      <section>
        <Label>Reaction Information (optional)</Label>
        <Textarea
          value={form.reactionInfo ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, reactionInfo: e.target.value }))}
          placeholder="Describe typical reactions, timing, and treatment..."
        />
      </section>

      {/* Cross Contact */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-primary">Cross Contact Sensitivity</h3>
        <div className="grid gap-3">
          <CheckboxField
            id="avoid-shared"
            label="Avoid shared equipment"
            checked={form.crossContact.avoidSharedEquipment}
            onCheckedChange={(v) =>
              setForm((f) => ({
                ...f,
                crossContact: { ...f.crossContact, avoidSharedEquipment: v },
              }))
            }
          />
          <CheckboxField
            id="trace-amounts"
            label="Trace amounts trigger reaction"
            checked={form.crossContact.traceAmountsTrigger}
            onCheckedChange={(v) =>
              setForm((f) => ({
                ...f,
                crossContact: { ...f.crossContact, traceAmountsTrigger: v },
              }))
            }
          />
          <CheckboxField
            id="ingredient-only"
            label="Ingredient only (not cross-contact sensitive)"
            checked={form.crossContact.ingredientOnly}
            onCheckedChange={(v) =>
              setForm((f) => ({
                ...f,
                crossContact: { ...f.crossContact, ingredientOnly: v },
              }))
            }
          />
        </div>
      </section>

      {/* Dietary Restrictions */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-primary">Dietary Restrictions</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIETARY_OPTIONS.map((item) => (
            <CheckboxField
              key={item}
              id={`diet-${item}`}
              label={item}
              checked={form.dietaryRestrictions.includes(item)}
              onCheckedChange={() => toggleDietary(item)}
            />
          ))}
        </div>
      </section>

      {/* Medical Notes */}
      <section>
        <Label>Medical Notes</Label>
        <Textarea
          value={form.medicalNotes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, medicalNotes: e.target.value }))}
          placeholder="Physician guidance, medications, EpiPen location, or other medical context..."
        />
      </section>

      {/* Emergency Food Contact */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-primary">Emergency Contact for Food Issues</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>
              Contact Name <span className="text-danger">*</span>
            </Label>
            <Input
              value={form.emergencyFoodContactName}
              onChange={(e) =>
                setForm((f) => ({ ...f, emergencyFoodContactName: e.target.value }))
              }
              placeholder="Parent or guardian"
            />
            {errors.emergencyFoodContactName && (
              <p className="mt-1 text-sm text-danger">{errors.emergencyFoodContactName}</p>
            )}
          </div>
          <div>
            <Label>
              Contact Phone <span className="text-danger">*</span>
            </Label>
            <Input
              value={form.emergencyFoodContactPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, emergencyFoodContactPhone: e.target.value }))
              }
              placeholder="555-0100"
            />
            {errors.emergencyFoodContactPhone && (
              <p className="mt-1 text-sm text-danger">{errors.emergencyFoodContactPhone}</p>
            )}
          </div>
        </div>
      </section>

      {/* Upload Documentation */}
      <section>
        <h3 className="mb-4 text-lg font-bold text-primary">Upload Documentation</h3>
        <p className="mb-4 text-sm text-silver-foreground">
          PDF or image files. Each upload creates a new version — previous documents are never
          overwritten.
        </p>
        <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-silver/80 bg-white p-6 hover:border-primary/40">
          <FileUp className="h-10 w-10 text-primary/50" />
          <span className="mt-3 font-medium text-primary">
            {uploading ? "Uploading..." : "Click to upload PDF or image"}
          </span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
        {docs.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-primary">Upload History</p>
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-2xl border border-silver/60 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-primary">{doc.fileName}</p>
                  <p className="text-silver-foreground">
                    v{doc.version} · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Emergency Meal Notes */}
      <section>
        <Label>Emergency Meal Notes</Label>
        <Input
          value={form.emergencyMealNotes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, emergencyMealNotes: e.target.value }))}
          placeholder="Safe alternative meals or instructions..."
        />
      </section>

      {/* Consent */}
      <section className="rounded-[20px] border border-silver/60 bg-white p-6">
        <CheckboxField
          id="consent"
          label="I confirm this information is accurate and will keep it current throughout the school year"
          checked={form.consentConfirmed === true}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, consentConfirmed: (v ? true : false) as true }))
          }
        />
        {errors.consentConfirmed && (
          <p className="mt-2 text-sm text-danger">{errors.consentConfirmed}</p>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label>Electronic Signature</Label>
            <Input
              value={form.electronicSignature}
              onChange={(e) =>
                setForm((f) => ({ ...f, electronicSignature: e.target.value }))
              }
            />
            {errors.electronicSignature && (
              <p className="mt-1 text-sm text-danger">{errors.electronicSignature}</p>
            )}
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.signatureDate}
              onChange={(e) => setForm((f) => ({ ...f, signatureDate: e.target.value }))}
            />
          </div>
        </div>
      </section>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-danger">
          <AlertCircle className="h-5 w-5" />
          <span>Please correct the errors above before submitting.</span>
        </div>
      )}

      <Button type="submit" className="min-h-14 w-full text-lg">
        Submit for Review
      </Button>
      <p className="text-center text-sm text-silver-foreground">
        Submissions require Nutrition Office approval before appearing at the cafeteria scan station.
      </p>
    </form>
  )
}
