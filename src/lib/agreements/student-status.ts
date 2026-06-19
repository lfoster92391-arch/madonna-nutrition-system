import type { AgreementSignatureStatus, StudentAgreementStatus } from "@/lib/agreements/types"

const EXPIRING_WINDOW_DAYS = 30

export function computeStudentAgreementStatus(input: {
  hasPublishedVersion: boolean
  signatureStatus: AgreementSignatureStatus | null
  versionExpiresAt: Date | null
  versionEffectiveDate: Date | null
  signedAt: Date | null
  now?: Date
}): StudentAgreementStatus {
  const now = input.now ?? new Date()

  if (!input.hasPublishedVersion) {
    return "AGREEMENT_REQUIRED"
  }

  if (input.signatureStatus === "REVOKED") {
    return "REVOKED"
  }

  if (!input.signatureStatus || input.signatureStatus === "PENDING") {
    return "AGREEMENT_REQUIRED"
  }

  if (input.signatureStatus === "EXPIRED") {
    return "RENEWAL_NEEDED"
  }

  if (input.versionExpiresAt && input.versionExpiresAt < now) {
    return "RENEWAL_NEEDED"
  }

  if (input.versionExpiresAt) {
    const msUntilExpiry = input.versionExpiresAt.getTime() - now.getTime()
    const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24)
    if (daysUntilExpiry <= EXPIRING_WINDOW_DAYS && daysUntilExpiry > 0) {
      return "EXPIRING"
    }
  }

  if (input.signatureStatus === "SIGNED" && input.signedAt) {
    return "SIGNED"
  }

  return "AGREEMENT_REQUIRED"
}

export function isLunchSignupAllowed(status: StudentAgreementStatus): boolean {
  return status === "SIGNED" || status === "EXPIRING"
}

export function formatStudentAgreementStatus(status: StudentAgreementStatus): string {
  switch (status) {
    case "AGREEMENT_REQUIRED":
      return "Agreement Required"
    case "SIGNED":
      return "Signed"
    case "EXPIRING":
      return "Expiring"
    case "RENEWAL_NEEDED":
      return "Renewal Needed"
    case "REVOKED":
      return "Revoked"
  }
}
