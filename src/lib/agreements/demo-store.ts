import {
  AGREEMENT_DEMO_STORAGE_KEY,
  AGREEMENT_DEMO_VERSIONS_KEY,
  DEFAULT_PUBLISHED_VERSION,
  type AgreementContent,
} from "@/config/agreement-defaults"
import { computeStudentAgreementStatus } from "@/lib/agreements/student-status"
import type {
  AgreementDashboardRow,
  AgreementSignatureDto,
  AgreementVersionDto,
  StudentAgreementStatusDto,
} from "@/lib/agreements/types"
import { isDemoPreviewActive } from "@/lib/demo/session"
import { parentLinkedStudents } from "@/data/demo"

function demoWalkthroughStudents() {
  return isDemoPreviewActive() ? parentLinkedStudents : []
}

export interface DemoSignatureRecord {
  id: string
  agreementVersionId: string
  parentUserId: string
  parentName: string
  relationship: string
  typedSignature: string
  studentIds: string[]
  signedAt: string
  ipAddress: string | null
  status: "SIGNED"
}

function readSignatures(): DemoSignatureRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(AGREEMENT_DEMO_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DemoSignatureRecord[]) : []
  } catch {
    return []
  }
}

function writeSignatures(records: DemoSignatureRecord[]) {
  localStorage.setItem(AGREEMENT_DEMO_STORAGE_KEY, JSON.stringify(records))
}

/** Drop cached demo signatures tied to a retired agreement version. */
function purgeStaleDemoSignatures(currentVersionId: string) {
  const signatures = readSignatures()
  const current = signatures.filter((s) => s.agreementVersionId === currentVersionId)
  if (current.length !== signatures.length) {
    writeSignatures(current)
  }
}

/** Remove demo cache for a parent when the authoritative source says unsigned. */
export function clearDemoAgreementCacheForParent(parentUserId: string) {
  if (typeof window === "undefined") return
  const currentVersionId = getDemoCurrentVersion().id
  const next = readSignatures().filter(
    (s) => !(s.parentUserId === parentUserId && s.agreementVersionId === currentVersionId)
  )
  writeSignatures(next)
}

function readVersions(): AgreementVersionDto[] {
  if (typeof window === "undefined") return [DEFAULT_PUBLISHED_VERSION as AgreementVersionDto]
  try {
    const raw = localStorage.getItem(AGREEMENT_DEMO_VERSIONS_KEY)
    if (!raw) return [DEFAULT_PUBLISHED_VERSION as AgreementVersionDto]
    return JSON.parse(raw) as AgreementVersionDto[]
  } catch {
    return [DEFAULT_PUBLISHED_VERSION as AgreementVersionDto]
  }
}

function writeVersions(versions: AgreementVersionDto[]) {
  localStorage.setItem(AGREEMENT_DEMO_VERSIONS_KEY, JSON.stringify(versions))
}

export function getDemoCurrentVersion(): AgreementVersionDto {
  const versions = readVersions()
  return (
    versions.find((v) => v.status === "PUBLISHED") ??
    (DEFAULT_PUBLISHED_VERSION as AgreementVersionDto)
  )
}

export function getDemoParentStatus(parentUserId: string): {
  requiresSignature: boolean
  currentVersion: AgreementVersionDto
  students: StudentAgreementStatusDto[]
} {
  const currentVersion = getDemoCurrentVersion()
  purgeStaleDemoSignatures(currentVersion.id)
  const signature = readSignatures().find(
    (s) => s.parentUserId === parentUserId && s.agreementVersionId === currentVersion.id
  )

  const students: StudentAgreementStatusDto[] = demoWalkthroughStudents().map((student) => {
    const status = computeStudentAgreementStatus({
      hasPublishedVersion: true,
      signatureStatus: signature?.status ?? null,
      versionExpiresAt: currentVersion.expiresAt ? new Date(currentVersion.expiresAt) : null,
      versionEffectiveDate: new Date(currentVersion.effectiveDate),
      signedAt: signature ? new Date(signature.signedAt) : null,
    })
    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      status,
      versionLabel: currentVersion.versionLabel,
      signedAt: signature?.signedAt ?? null,
    }
  })

  const requiresSignature = students.some(
    (s) =>
      s.status === "AGREEMENT_REQUIRED" ||
      s.status === "RENEWAL_NEEDED" ||
      s.status === "REVOKED"
  )

  return { requiresSignature, currentVersion, students }
}

export function signDemoAgreement(input: {
  parentUserId: string
  parentName: string
  relationship: string
  typedSignature: string
  ipAddress?: string | null
}): AgreementSignatureDto {
  const currentVersion = getDemoCurrentVersion()
  const record: DemoSignatureRecord = {
    id: `demo-sig-${Date.now()}`,
    agreementVersionId: currentVersion.id,
    parentUserId: input.parentUserId,
    parentName: input.parentName,
    relationship: input.relationship,
    typedSignature: input.typedSignature,
    studentIds: demoWalkthroughStudents().map((s) => s.id),
    signedAt: new Date().toISOString(),
    ipAddress: input.ipAddress ?? null,
    status: "SIGNED",
  }
  const existing = readSignatures().filter(
    (s) => !(s.parentUserId === input.parentUserId && s.agreementVersionId === currentVersion.id)
  )
  writeSignatures([record, ...existing])

  return {
    id: record.id,
    agreementVersionId: currentVersion.id,
    versionLabel: currentVersion.versionLabel,
    parentId: "demo-parent",
    parentName: input.parentName,
    parentEmail: "sarah.anderson@email.com",
    relationship: input.relationship,
    typedSignature: input.typedSignature,
    studentIds: record.studentIds,
    studentNames: demoWalkthroughStudents().map((s) => `${s.firstName} ${s.lastName}`),
    signedAt: record.signedAt,
    ipAddress: record.ipAddress,
    status: "SIGNED",
  }
}

export function listDemoVersions(): AgreementVersionDto[] {
  return readVersions()
}

export function saveDemoDraftVersion(input: {
  id?: string
  versionLabel: string
  effectiveDate: string
  expiresAt: string | null
  content: AgreementContent
}): AgreementVersionDto {
  const versions = readVersions()
  const versionNumber =
    versions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + (input.id ? 0 : 1)
  const now = new Date().toISOString()
  const dto: AgreementVersionDto = {
    id: input.id ?? `demo-version-${Date.now()}`,
    versionLabel: input.versionLabel,
    versionNumber: input.id
      ? (versions.find((v) => v.id === input.id)?.versionNumber ?? versionNumber)
      : versionNumber,
    status: "DRAFT",
    effectiveDate: input.effectiveDate,
    expiresAt: input.expiresAt,
    content: input.content,
    publishedAt: null,
    publishedBy: null,
    createdAt: now,
    updatedAt: now,
  }

  const next = input.id
    ? versions.map((v) => (v.id === input.id ? dto : v))
    : [dto, ...versions]
  writeVersions(next)
  return dto
}

export function publishDemoVersion(id: string): AgreementVersionDto | null {
  const versions = readVersions()
  const target = versions.find((v) => v.id === id)
  if (!target) return null
  const now = new Date().toISOString()
  const next = versions.map((v) => {
    if (v.id === id) {
      return { ...v, status: "PUBLISHED" as const, publishedAt: now, updatedAt: now }
    }
    if (v.status === "PUBLISHED") {
      return { ...v, status: "ARCHIVED" as const, updatedAt: now }
    }
    return v
  })
  writeVersions(next)
  return next.find((v) => v.id === id) ?? null
}

export function archiveDemoVersion(id: string): AgreementVersionDto | null {
  const versions = readVersions()
  const next = versions.map((v) =>
    v.id === id ? { ...v, status: "ARCHIVED" as const, updatedAt: new Date().toISOString() } : v
  )
  writeVersions(next)
  return next.find((v) => v.id === id) ?? null
}

export function listDemoDashboard(): AgreementDashboardRow[] {
  const currentVersion = getDemoCurrentVersion()
  return readSignatures().map((sig) => ({
    id: sig.id,
    parentId: "demo-parent",
    parentName: sig.parentName,
    parentEmail: "sarah.anderson@email.com",
    students: demoWalkthroughStudents()
      .filter((s) => sig.studentIds.includes(s.id))
      .map((s) => `${s.firstName} ${s.lastName}`),
    versionLabel: currentVersion.versionLabel,
    versionNumber: currentVersion.versionNumber,
    signed: true,
    signedAt: sig.signedAt,
    ipAddress: sig.ipAddress,
    status: "SIGNED",
  }))
}

export function ensureDemoPublishedVersion() {
  const versions = readVersions()
  if (!versions.some((v) => v.status === "PUBLISHED")) {
    writeVersions([DEFAULT_PUBLISHED_VERSION as AgreementVersionDto, ...versions])
  }
  purgeStaleDemoSignatures(getDemoCurrentVersion().id)
}
