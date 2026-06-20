import type { AllergySubmission, MedicalDocument, StudentProfile } from "@/lib/types"

export function getStudentProfile(
  studentId: string,
  profiles: StudentProfile[]
): StudentProfile | undefined {
  return profiles.find((p) => p.studentId === studentId)
}

export function getPendingSubmission(
  studentId: string,
  submissions: AllergySubmission[]
): AllergySubmission | undefined {
  return submissions.find(
    (s) =>
      s.studentId === studentId &&
      (s.status === "pending_review" || s.status === "clarification_requested")
  )
}

export function getMedicalDocumentsForStudent(
  studentId: string,
  documents: MedicalDocument[]
): MedicalDocument[] {
  return documents
    .filter((d) => d.studentId === studentId)
    .sort((a, b) => b.version - a.version)
}
