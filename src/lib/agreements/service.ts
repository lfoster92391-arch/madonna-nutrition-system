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
  ParentAgreementStatusDto,
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

function acceptedCurrentPublishedVersion(
  acceptedAt: Date | null | undefined,
  acceptedVersionId: string | null | undefined,
  currentVersionId: string
): boolean {
  if (!acceptedAt) return false
  return acceptedVersionId === currentVersionId
}

type ResolvedParentAccount = {
  userId: string
  parentId: string
  parentEmail: string
  parentName: string
  studentIds: string[]
  cafeteriaAgreementAcceptedAt: Date | null
  cafeteriaAgreementVersionId: string | null
  parentAcceptedAt: Date | null
  parentAcceptedVersionId: string | null
}

/** Upsert a Parent row for any User so signing/status never 400 on a missing Parent. */
async function resolveParentAccount(parentUserId: string): Promise<ResolvedParentAccount | null> {
  const user = await prisma.user.findUnique({
    where: { id: parentUserId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      linkedStudentIds: true,
      cafeteriaAgreementAcceptedAt: true,
      cafeteriaAgreementVersionId: true,
    },
  })
  if (!user) return null

  const parentName = `${user.firstName} ${user.lastName}`.trim() || user.email
  const parent = await prisma.parent.upsert({
    where: { email: user.email.toLowerCase() },
    update: { name: parentName },
    create: { email: user.email.toLowerCase(), name: parentName },
  })

  const linkedFromUser = user.linkedStudentIds ?? []
  const studentsFromLinks =
    linkedFromUser.length === 0
      ? []
      : await prisma.student.findMany({
          where: {
            OR: [{ id: { in: linkedFromUser } }, { externalId: { in: linkedFromUser } }],
          },
          select: { id: true },
        })

  const studentsFromParent = await prisma.parentStudent.findMany({
    where: { parentId: parent.id },
    select: { studentId: true },
  })

  const studentIds = [
    ...new Set([...studentsFromLinks.map((s) => s.id), ...studentsFromParent.map((s) => s.studentId)]),
  ]

  return {
    userId: user.id,
    parentId: parent.id,
    parentEmail: parent.email,
    parentName: parent.name,
    studentIds,
    cafeteriaAgreementAcceptedAt: user.cafeteriaAgreementAcceptedAt,
    cafeteriaAgreementVersionId: user.cafeteriaAgreementVersionId,
    parentAcceptedAt: parent.cafeteriaAgreementAcceptedAt,
    parentAcceptedVersionId: parent.cafeteriaAgreementVersionId,
  }
}

export async function ensureParentRecordForUser(parentUserId: string): Promise<void> {
  await resolveParentAccount(parentUserId)
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

  const account = await resolveParentAccount(input.parentUserId)
  if (!account) {
    throw new Error("Parent user not found")
  }

  const { parentId, parentEmail, studentIds } = account
  const signedAt = new Date()

  // Persist on User first so Chromebooks without cookies still pass the gate.
  await prisma.user.update({
    where: { id: input.parentUserId },
    data: {
      cafeteriaAgreementAcceptedAt: signedAt,
      cafeteriaAgreementVersionId: published.id,
    },
  })

  await prisma.parent.update({
    where: { id: parentId },
    data: {
      cafeteriaAgreementAcceptedAt: signedAt,
      cafeteriaAgreementVersionId: published.id,
    },
  })

  const signature = await prisma.agreementSignature.create({
    data: {
      agreementVersionId: published.id,
      parentId,
      parentUserId: input.parentUserId,
      parentName: input.parentName.trim(),
      relationship: input.relationship.trim(),
      typedSignature: input.typedSignature.trim(),
      studentIds,
      signedAt,
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
        signedAt,
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
        signedAt,
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
): Promise<ParentAgreementStatusDto> {
  const currentVersion = await getCurrentPublishedAgreement()
  if (!currentVersion) {
    return { requiresSignature: false, accepted: true, currentVersion: null, students: [] }
  }

  const parentUser = await prisma.user.findUnique({
    where: { id: parentUserId },
    select: {
      cafeteriaAgreementAcceptedAt: true,
      cafeteriaAgreementVersionId: true,
    },
  })

  const acceptedOnUser = acceptedCurrentPublishedVersion(
    parentUser?.cafeteriaAgreementAcceptedAt,
    parentUser?.cafeteriaAgreementVersionId,
    currentVersion.id
  )

  let account: ResolvedParentAccount | null = null
  try {
    account = await resolveParentAccount(parentUserId)
  } catch (error) {
    console.warn("[agreements/status] parent record resolve failed; using User acceptance", error)
  }

  const acceptedOnParent = acceptedCurrentPublishedVersion(
    account?.parentAcceptedAt,
    account?.parentAcceptedVersionId,
    currentVersion.id
  )

  const signature =
    account != null
      ? await prisma.agreementSignature.findFirst({
          where: {
            agreementVersionId: currentVersion.id,
            status: "SIGNED",
            OR: [{ parentId: account.parentId }, { parentUserId }],
          },
          orderBy: { signedAt: "desc" },
        })
      : await prisma.agreementSignature.findFirst({
          where: {
            parentUserId,
            agreementVersionId: currentVersion.id,
            status: "SIGNED",
          },
          orderBy: { signedAt: "desc" },
        })

  const acceptedViaSignature = signature?.status === "SIGNED"
  const accepted = acceptedOnUser || acceptedOnParent || acceptedViaSignature
  const studentIds = account?.studentIds ?? []

  if (studentIds.length === 0) {
    return {
      requiresSignature: !accepted,
      accepted,
      currentVersion,
      students: [],
    }
  }

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, firstName: true, lastName: true },
  })

  const studentStatuses: StudentAgreementStatusDto[] = students.map((student) => {
    const status = computeStudentAgreementStatus({
      hasPublishedVersion: true,
      signatureStatus: accepted ? "SIGNED" : (signature?.status ?? null),
      versionExpiresAt: currentVersion.expiresAt ? new Date(currentVersion.expiresAt) : null,
      versionEffectiveDate: new Date(currentVersion.effectiveDate),
      signedAt:
        signature?.signedAt ??
        parentUser?.cafeteriaAgreementAcceptedAt ??
        account?.parentAcceptedAt ??
        null,
    })
    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      status,
      versionLabel: currentVersion.versionLabel,
      signedAt:
        signature?.signedAt?.toISOString() ??
        parentUser?.cafeteriaAgreementAcceptedAt?.toISOString() ??
        account?.parentAcceptedAt?.toISOString() ??
        null,
    }
  })

  return {
    requiresSignature: !accepted,
    accepted,
    currentVersion,
    students: studentStatuses,
  }
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

  const signedStatus =
    lunchAgreement?.agreementSignature?.status === "SIGNED" || lunchAgreement?.status === "SIGNED"
      ? "SIGNED"
      : (lunchAgreement?.agreementSignature?.status ?? null)

  const status = computeStudentAgreementStatus({
    hasPublishedVersion: true,
    signatureStatus: signedStatus,
    versionExpiresAt: currentVersion.expiresAt ? new Date(currentVersion.expiresAt) : null,
    versionEffectiveDate: new Date(currentVersion.effectiveDate),
    signedAt: lunchAgreement?.signedAt ?? lunchAgreement?.agreementSignature?.signedAt ?? null,
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
