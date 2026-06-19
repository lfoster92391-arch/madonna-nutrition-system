import type { Prisma } from "@prisma/client"
import type { AgreementContent } from "@/config/agreement-defaults"
import { DEFAULT_AGREEMENT_CONTENT } from "@/config/agreement-defaults"
import { createAuditLog } from "@/lib/db/audit"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { computeStudentAgreementStatus } from "@/lib/agreements/student-status"
import type {
  AgreementDashboardRow,
  AgreementSignatureDto,
  AgreementVersionDto,
  StudentAgreementStatusDto,
} from "@/lib/agreements/types"

function parseContent(raw: unknown): AgreementContent {
  if (!raw || typeof raw !== "object") return DEFAULT_AGREEMENT_CONTENT
  const c = raw as Partial<AgreementContent>
  return {
    mealSignUpPolicy: c.mealSignUpPolicy ?? DEFAULT_AGREEMENT_CONTENT.mealSignUpPolicy,
    pricing: {
      mainMeal: c.pricing?.mainMeal ?? DEFAULT_AGREEMENT_CONTENT.pricing.mainMeal,
      premiumSides: c.pricing?.premiumSides ?? DEFAULT_AGREEMENT_CONTENT.pricing.premiumSides,
      lightMeal: c.pricing?.lightMeal ?? DEFAULT_AGREEMENT_CONTENT.pricing.lightMeal,
      drinks: c.pricing?.drinks ?? DEFAULT_AGREEMENT_CONTENT.pricing.drinks,
    },
    responsibilities: c.responsibilities ?? DEFAULT_AGREEMENT_CONTENT.responsibilities,
  }
}

function mapVersion(v: {
  id: string
  versionLabel: string
  versionNumber: number
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  effectiveDate: Date
  expiresAt: Date | null
  content: unknown
  publishedAt: Date | null
  publishedBy: string | null
  createdAt: Date
  updatedAt: Date
}): AgreementVersionDto {
  return {
    id: v.id,
    versionLabel: v.versionLabel,
    versionNumber: v.versionNumber,
    status: v.status,
    effectiveDate: v.effectiveDate.toISOString(),
    expiresAt: v.expiresAt?.toISOString() ?? null,
    content: parseContent(v.content),
    publishedAt: v.publishedAt?.toISOString() ?? null,
    publishedBy: v.publishedBy,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  }
}

export async function listAgreementVersions(): Promise<AgreementVersionDto[]> {
  const schoolId = await resolveSchoolId()
  const versions = await prisma.agreementVersion.findMany({
    where: { schoolId },
    orderBy: { versionNumber: "desc" },
  })
  return versions.map(mapVersion)
}

export async function getAgreementVersionById(id: string): Promise<AgreementVersionDto | null> {
  const schoolId = await resolveSchoolId()
  const version = await prisma.agreementVersion.findFirst({
    where: { id, schoolId },
  })
  return version ? mapVersion(version) : null
}

export async function getCurrentPublishedAgreement(): Promise<AgreementVersionDto | null> {
  const schoolId = await resolveSchoolId()
  const version = await prisma.agreementVersion.findFirst({
    where: { schoolId, status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  })
  return version ? mapVersion(version) : null
}

export async function createAgreementVersion(input: {
  versionLabel: string
  effectiveDate: Date
  expiresAt?: Date | null
  content?: AgreementContent
  performedBy?: string
}): Promise<AgreementVersionDto> {
  const schoolId = await resolveSchoolId()
  const latest = await prisma.agreementVersion.findFirst({
    where: { schoolId },
    orderBy: { versionNumber: "desc" },
    select: { versionNumber: true },
  })
  const versionNumber = (latest?.versionNumber ?? 0) + 1
  const version = await prisma.agreementVersion.create({
    data: {
      versionLabel: input.versionLabel,
      versionNumber,
      effectiveDate: input.effectiveDate,
      expiresAt: input.expiresAt ?? null,
      content: (input.content ?? DEFAULT_AGREEMENT_CONTENT) as unknown as Prisma.InputJsonValue,
      schoolId,
    },
  })

  await prisma.agreementAuditLog.create({
    data: {
      action: "VERSION_CREATED",
      agreementVersionId: version.id,
      performedBy: input.performedBy,
      metadata: { versionLabel: version.versionLabel, versionNumber },
      schoolId,
    },
  })

  return mapVersion(version)
}

export async function updateAgreementVersion(
  id: string,
  input: {
    versionLabel?: string
    effectiveDate?: Date
    expiresAt?: Date | null
    content?: AgreementContent
    performedBy?: string
  }
): Promise<AgreementVersionDto | null> {
  const schoolId = await resolveSchoolId()
  const existing = await prisma.agreementVersion.findFirst({
    where: { id, schoolId, status: "DRAFT" },
  })
  if (!existing) return null

  const version = await prisma.agreementVersion.update({
    where: { id },
    data: {
      versionLabel: input.versionLabel,
      effectiveDate: input.effectiveDate,
      expiresAt: input.expiresAt,
      content: input.content ? (input.content as unknown as Prisma.InputJsonValue) : undefined,
    },
  })

  await prisma.agreementAuditLog.create({
    data: {
      action: "VERSION_UPDATED",
      agreementVersionId: version.id,
      performedBy: input.performedBy,
      schoolId,
    },
  })

  return mapVersion(version)
}

export async function publishAgreementVersion(
  id: string,
  performedBy?: string
): Promise<AgreementVersionDto | null> {
  const schoolId = await resolveSchoolId()
  const existing = await prisma.agreementVersion.findFirst({
    where: { id, schoolId, status: "DRAFT" },
  })
  if (!existing) return null

  await prisma.agreementVersion.updateMany({
    where: { schoolId, status: "PUBLISHED" },
    data: { status: "ARCHIVED" },
  })

  const version = await prisma.agreementVersion.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedBy: performedBy ?? null,
    },
  })

  await prisma.agreementAuditLog.create({
    data: {
      action: "VERSION_PUBLISHED",
      agreementVersionId: version.id,
      performedBy,
      metadata: { versionLabel: version.versionLabel },
      schoolId,
    },
  })

  await createAuditLog({
    action: "AGREEMENT_VERSION_PUBLISHED",
    entity: "AgreementVersion",
    entityId: version.id,
    performedBy,
    metadata: { versionLabel: version.versionLabel, versionNumber: version.versionNumber },
  })

  return mapVersion(version)
}

export async function archiveAgreementVersion(
  id: string,
  performedBy?: string
): Promise<AgreementVersionDto | null> {
  const schoolId = await resolveSchoolId()
  const existing = await prisma.agreementVersion.findFirst({
    where: { id, schoolId, status: { in: ["PUBLISHED", "DRAFT"] } },
  })
  if (!existing) return null

  const version = await prisma.agreementVersion.update({
    where: { id },
    data: { status: "ARCHIVED" },
  })

  await prisma.agreementAuditLog.create({
    data: {
      action: "VERSION_ARCHIVED",
      agreementVersionId: version.id,
      performedBy,
      schoolId,
    },
  })

  return mapVersion(version)
}

async function resolveParentLinkedStudentIds(parentUserId: string): Promise<{
  parentId: string
  parentEmail: string
  parentName: string
  studentIds: string[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: parentUserId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      linkedStudentIds: true,
      role: true,
    },
  })
  if (!user || user.role !== "PARENT") {
    throw new Error("Parent user not found")
  }

  const parent = await prisma.parent.upsert({
    where: { email: user.email.toLowerCase() },
    update: { name: `${user.firstName} ${user.lastName}` },
    create: { email: user.email.toLowerCase(), name: `${user.firstName} ${user.lastName}` },
  })

  const linkedFromUser = user.linkedStudentIds ?? []
  const studentsFromLinks = await prisma.student.findMany({
    where: {
      OR: [
        { id: { in: linkedFromUser } },
        { externalId: { in: linkedFromUser } },
      ],
    },
    select: { id: true },
  })

  const studentsFromParent = await prisma.parentStudent.findMany({
    where: { parentId: parent.id },
    select: { studentId: true },
  })

  const studentIds = [
    ...new Set([
      ...studentsFromLinks.map((s) => s.id),
      ...studentsFromParent.map((s) => s.studentId),
    ]),
  ]

  return {
    parentId: parent.id,
    parentEmail: parent.email,
    parentName: parent.name,
    studentIds,
  }
}

export async function signAgreement(input: {
  parentUserId: string
  parentName: string
  relationship: string
  typedSignature: string
  acceptedTerms: boolean
  ipAddress: string | null
}): Promise<AgreementSignatureDto> {
  if (!input.acceptedTerms) {
    throw new Error("Terms must be accepted")
  }
  if (input.typedSignature.trim().toLowerCase() !== input.parentName.trim().toLowerCase()) {
    throw new Error("Typed signature must match parent full name")
  }

  const schoolId = await resolveSchoolId()
  const published = await prisma.agreementVersion.findFirst({
    where: { schoolId, status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  })
  if (!published) {
    throw new Error("No published agreement version available")
  }

  const { parentId, parentEmail, studentIds } = await resolveParentLinkedStudentIds(
    input.parentUserId
  )
  if (studentIds.length === 0) {
    throw new Error("No linked students found for this parent account")
  }

  const signature = await prisma.agreementSignature.create({
    data: {
      agreementVersionId: published.id,
      parentId,
      parentUserId: input.parentUserId,
      parentName: input.parentName.trim(),
      relationship: input.relationship.trim(),
      typedSignature: input.typedSignature.trim(),
      studentIds,
      signedAt: new Date(),
      ipAddress: input.ipAddress,
      status: "SIGNED",
      schoolId,
    },
  })

  for (const studentId of studentIds) {
    await prisma.lunchAgreement.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      update: {
        agreementVersionId: published.id,
        agreementSignatureId: signature.id,
        signedAt: signature.signedAt,
        signatureData: input.typedSignature.trim(),
        status: "SIGNED",
        acceptedTerms: true,
      },
      create: {
        parentId,
        studentId,
        schoolId,
        agreementVersionId: published.id,
        agreementSignatureId: signature.id,
        signedAt: signature.signedAt,
        signatureData: input.typedSignature.trim(),
        status: "SIGNED",
        acceptedTerms: true,
      },
    })
  }

  await prisma.agreementAuditLog.create({
    data: {
      action: "AGREEMENT_SIGNED",
      agreementVersionId: published.id,
      signatureId: signature.id,
      parentId,
      parentName: input.parentName.trim(),
      ipAddress: input.ipAddress,
      metadata: {
        studentCount: studentIds.length,
        relationship: input.relationship.trim(),
      },
      performedBy: input.parentUserId,
      schoolId,
    },
  })

  await createAuditLog({
    action: "AGREEMENT_SIGNED",
    entity: "AgreementSignature",
    entityId: signature.id,
    performedBy: input.parentUserId,
    metadata: {
      parentName: input.parentName.trim(),
      studentCount: studentIds.length,
      versionLabel: published.versionLabel,
      ipAddress: input.ipAddress,
    },
  })

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true },
  })

  return {
    id: signature.id,
    agreementVersionId: published.id,
    versionLabel: published.versionLabel,
    parentId,
    parentName: input.parentName.trim(),
    parentEmail,
    relationship: input.relationship.trim(),
    typedSignature: input.typedSignature.trim(),
    studentIds,
    studentNames: students.map((s) => `${s.firstName} ${s.lastName}`),
    signedAt: signature.signedAt?.toISOString() ?? null,
    ipAddress: signature.ipAddress,
    status: signature.status,
  }
}

export async function getParentAgreementStatus(
  parentUserId: string
): Promise<{
  requiresSignature: boolean
  currentVersion: AgreementVersionDto | null
  students: StudentAgreementStatusDto[]
}> {
  const currentVersion = await getCurrentPublishedAgreement()
  if (!currentVersion) {
    return { requiresSignature: true, currentVersion: null, students: [] }
  }

  const { parentId, studentIds } = await resolveParentLinkedStudentIds(parentUserId)
  if (studentIds.length === 0) {
    return { requiresSignature: true, currentVersion, students: [] }
  }

  const signature = await prisma.agreementSignature.findFirst({
    where: {
      parentId,
      agreementVersionId: currentVersion.id,
      status: "SIGNED",
    },
    orderBy: { signedAt: "desc" },
  })

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true },
  })

  const studentStatuses: StudentAgreementStatusDto[] = students.map((student) => {
    const status = computeStudentAgreementStatus({
      hasPublishedVersion: true,
      signatureStatus: signature?.status ?? null,
      versionExpiresAt: currentVersion.expiresAt ? new Date(currentVersion.expiresAt) : null,
      versionEffectiveDate: new Date(currentVersion.effectiveDate),
      signedAt: signature?.signedAt ?? null,
    })
    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      status,
      versionLabel: currentVersion.versionLabel,
      signedAt: signature?.signedAt?.toISOString() ?? null,
    }
  })

  const requiresSignature = studentStatuses.some(
    (s) => s.status === "AGREEMENT_REQUIRED" || s.status === "RENEWAL_NEEDED" || s.status === "REVOKED"
  )

  return { requiresSignature, currentVersion, students: studentStatuses }
}

export async function listAgreementDashboard(input?: {
  parentQuery?: string
  studentQuery?: string
}): Promise<AgreementDashboardRow[]> {
  const schoolId = await resolveSchoolId()
  const signatures = await prisma.agreementSignature.findMany({
    where: { schoolId },
    include: {
      agreementVersion: { select: { versionLabel: true, versionNumber: true } },
      parent: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  const allStudentIds = [...new Set(signatures.flatMap((s) => s.studentIds))]
  const students = await prisma.student.findMany({
    where: { id: { in: allStudentIds } },
    select: { id: true, firstName: true, lastName: true, externalId: true },
  })
  const studentMap = new Map(students.map((s) => [s.id, s]))

  let rows: AgreementDashboardRow[] = signatures.map((sig) => {
    const studentNames = sig.studentIds
      .map((id) => {
        const s = studentMap.get(id)
        return s ? `${s.firstName} ${s.lastName}` : id
      })
      .filter(Boolean)

    return {
      id: sig.id,
      parentId: sig.parentId,
      parentName: sig.parentName,
      parentEmail: sig.parent.email,
      students: studentNames,
      versionLabel: sig.agreementVersion.versionLabel,
      versionNumber: sig.agreementVersion.versionNumber,
      signed: sig.status === "SIGNED" && Boolean(sig.signedAt),
      signedAt: sig.signedAt?.toISOString() ?? null,
      ipAddress: sig.ipAddress,
      status: sig.status,
    }
  })

  const parentQ = input?.parentQuery?.trim().toLowerCase()
  const studentQ = input?.studentQuery?.trim().toLowerCase()

  if (parentQ) {
    rows = rows.filter(
      (r) =>
        r.parentName.toLowerCase().includes(parentQ) ||
        (r.parentEmail?.toLowerCase().includes(parentQ) ?? false)
    )
  }

  if (studentQ) {
    rows = rows.filter((r) =>
      r.students.some((name) => name.toLowerCase().includes(studentQ))
    )
  }

  return rows
}

export async function getStudentAgreementStatusById(
  studentId: string
): Promise<StudentAgreementStatusDto | null> {
  const schoolId = await resolveSchoolId()
  const student = await prisma.student.findFirst({
    where: { OR: [{ id: studentId }, { externalId: studentId }], schoolId },
  })
  if (!student) return null

  const currentVersion = await getCurrentPublishedAgreement()
  if (!currentVersion) {
    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      status: "AGREEMENT_REQUIRED",
      versionLabel: null,
      signedAt: null,
    }
  }

  const lunchAgreement = await prisma.lunchAgreement.findFirst({
    where: {
      studentId: student.id,
      agreementVersionId: currentVersion.id,
      status: "SIGNED",
    },
    include: { agreementSignature: true },
  })

  const status = computeStudentAgreementStatus({
    hasPublishedVersion: true,
    signatureStatus: lunchAgreement?.agreementSignature?.status ?? null,
    versionExpiresAt: currentVersion.expiresAt ? new Date(currentVersion.expiresAt) : null,
    versionEffectiveDate: new Date(currentVersion.effectiveDate),
    signedAt: lunchAgreement?.signedAt ?? null,
  })

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    status,
    versionLabel: currentVersion.versionLabel,
    signedAt: lunchAgreement?.signedAt?.toISOString() ?? null,
  }
}

export async function getRecentAgreementNotifications(limit = 10) {
  const schoolId = await resolveSchoolId()
  const logs = await prisma.agreementAuditLog.findMany({
    where: { schoolId, action: "AGREEMENT_SIGNED" },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return logs.map((log) => ({
    id: log.id,
    title: "New Cafeteria Agreement Signed",
    parentName: log.parentName,
    studentCount: (log.metadata as { studentCount?: number })?.studentCount ?? 0,
    date: log.createdAt.toISOString(),
    signatureId: log.signatureId,
  }))
}
