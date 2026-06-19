import type { AgreementContent } from "@/config/agreement-defaults"

export type AgreementVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"
export type AgreementSignatureStatus = "PENDING" | "SIGNED" | "EXPIRED" | "REVOKED"
export type StudentAgreementStatus =
  | "AGREEMENT_REQUIRED"
  | "SIGNED"
  | "EXPIRING"
  | "RENEWAL_NEEDED"
  | "REVOKED"

export interface AgreementVersionDto {
  id: string
  versionLabel: string
  versionNumber: number
  status: AgreementVersionStatus
  effectiveDate: string
  expiresAt: string | null
  content: AgreementContent
  publishedAt: string | null
  publishedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface AgreementSignatureDto {
  id: string
  agreementVersionId: string
  versionLabel: string
  parentId: string
  parentName: string
  parentEmail: string | null
  relationship: string
  typedSignature: string
  studentIds: string[]
  studentNames: string[]
  signedAt: string | null
  ipAddress: string | null
  status: AgreementSignatureStatus
}

export interface AgreementDashboardRow {
  id: string
  parentId: string
  parentName: string
  parentEmail: string | null
  students: string[]
  versionLabel: string
  versionNumber: number
  signed: boolean
  signedAt: string | null
  ipAddress: string | null
  status: AgreementSignatureStatus
}

export interface StudentAgreementStatusDto {
  studentId: string
  studentName: string
  status: StudentAgreementStatus
  versionLabel: string | null
  signedAt: string | null
}
