import { prisma } from "@/lib/prisma"
import { allergiesToCreateInput, badgeStatusToDb, photoStatusToDb } from "@/lib/db/mappers"
import { createAuditLog } from "@/lib/db/audit"
import {
  allocateNextMdId,
  findStudentByEmail,
  findStudentByExternalId,
  findStudentByMadonnaEmailHint,
  findStudentByName,
} from "@/lib/db/students"
import {
  parseStudentDisplayName,
  resolveImportGrade,
} from "@/lib/students/grade-from-email"
import { photoStatusForSchoolPhoto } from "@/lib/students/photo-moderation"
import type { studentImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type StudentImportRow = z.infer<typeof studentImportRowSchema> & {
  _rowNumber?: number
  /** Combined "Last, First" when first/last were not split in the CSV. */
  studentName?: string
}

export interface StudentImportError {
  row: number
  message: string
}

export interface StudentImportRowOutcome {
  row: number
  mdId: string
  status: "created" | "updated" | "skipped" | "error"
  message?: string
}

export interface StudentImportResult {
  matched: number
  created: number
  updated: number
  skipped: number
  errors: StudentImportError[]
  rowOutcomes: StudentImportRowOutcome[]
}

function parseAllergies(raw?: string) {
  if (!raw?.trim()) return []
  return raw.split(/[,;]/).map((name) => ({
    name: name.trim(),
    severity: "MODERATE" as const,
  }))
}

function parseDietary(raw?: string) {
  if (!raw?.trim()) return []
  return raw
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function resolvePhoto(row: StudentImportRow): string | undefined {
  const fromUrl = row.photoUrl?.trim()
  if (fromUrl) return fromUrl
  const fromPhoto = row.photo?.trim()
  return fromPhoto || undefined
}

/** School / roster photo URLs are badge-ready without parent moderation. */
function schoolPhotoWrite(photo?: string) {
  if (!photo) return {}
  return {
    photo,
    photoStatus: photoStatusToDb(photoStatusForSchoolPhoto(photo)),
  }
}

function resolveParentName(row: StudentImportRow, email: string): string {
  const named = row.parentName?.trim() || row.parent?.trim()
  if (named) return named
  return email.split("@")[0] ?? "Parent"
}

function resolveNames(row: StudentImportRow): { firstName: string; lastName: string } {
  let firstName = row.firstName?.trim() ?? ""
  let lastName = row.lastName?.trim() ?? ""
  if ((!firstName || !lastName) && row.studentName?.trim()) {
    const parsed = parseStudentDisplayName(row.studentName)
    if (!firstName) firstName = parsed.firstName
    if (!lastName) lastName = parsed.lastName
  }
  return { firstName, lastName }
}

async function upsertParentLink(input: {
  studentId: string
  email: string
  name: string
  phone?: string
}) {
  const parent = await prisma.parent.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      phone: input.phone?.trim() || undefined,
    },
    create: {
      email: input.email,
      name: input.name,
      phone: input.phone?.trim() || null,
    },
  })
  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parent.id, studentId: input.studentId },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: input.studentId,
      relationship: "Guardian",
    },
  })
}

async function resolveExistingStudent(input: {
  mdId?: string
  email?: string
  firstName: string
  lastName: string
  schoolId: string
}) {
  if (input.mdId) {
    const byId = await findStudentByExternalId(input.mdId)
    if (byId) return { student: byId, via: "mdId" as const }
  }
  if (input.email) {
    const byEmail = await findStudentByEmail(input.email)
    if (byEmail) return { student: byEmail, via: "email" as const }

    const byHint = await findStudentByMadonnaEmailHint(input.email, input.schoolId)
    if (byHint) return { student: byHint, via: "email_hint" as const }
  }
  if (input.firstName && input.lastName) {
    const byName = await findStudentByName(input.firstName, input.lastName)
    if (byName) return { student: byName, via: "name" as const }
  }
  return null
}

export async function importStudentRows(input: {
  rows: StudentImportRow[]
  schoolId: string
  performedBy: string
  updateExisting?: boolean
}): Promise<StudentImportResult> {
  const result: StudentImportResult = {
    matched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    rowOutcomes: [],
  }

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]!
    const rowNumber = row._rowNumber ?? i + 1
    const { firstName, lastName } = resolveNames(row)
    const email = row.email?.trim().toLowerCase() || undefined
    let mdId = row.mdId?.trim() || ""

    try {
      if (!firstName || !lastName) {
        throw new Error("firstName and lastName are required (or provide studentName as Last, First)")
      }

      const match = await resolveExistingStudent({
        mdId: mdId || undefined,
        email,
        firstName,
        lastName,
        schoolId: input.schoolId,
      })

      const gradeInfo = resolveImportGrade(email, row.grade)
      const allergies = parseAllergies(row.allergies)
      const dietaryRestrictions = parseDietary(row.dietaryRestrictions)
      const photo = resolvePhoto(row)
      const parentEmail = row.parentEmail?.trim().toLowerCase()
      const grade = gradeInfo.grade
      const balance = row.balance
      // badgeStatus is schema-defaulted to active; treat as explicit only when CSV sent a value.
      const explicitBadge = row.badgeStatus

      if (match) {
        const existing = match.student
        mdId = existing.externalId
        result.matched += 1
        if (!input.updateExisting) {
          result.skipped += 1
          result.rowOutcomes.push({
            row: rowNumber,
            mdId,
            status: "skipped",
            message: `Existing student (${match.via}) — update not enabled`,
          })
          continue
        }

        // Email-hint matches (initial+lastname) often have wrong first names in directory
        // exports — keep roster names, still sync email/grade/archive.
        const keepRosterNames = match.via === "email_hint"
        const nextFirst = keepRosterNames ? existing.firstName : firstName
        const nextLast = keepRosterNames ? existing.lastName : lastName
        const photoUpdate = schoolPhotoWrite(photo)
        const hasAllergiesColumn = row.allergies !== undefined
        const hasDietaryColumn = row.dietaryRestrictions !== undefined

        const badgeStatus = gradeInfo.shouldArchive
          ? badgeStatusToDb("inactive")
          : explicitBadge
            ? badgeStatusToDb(explicitBadge)
            : undefined

        await prisma.$transaction(async (tx) => {
          if (hasAllergiesColumn) {
            await tx.allergy.deleteMany({ where: { studentId: existing.id } })
            if (allergies.length > 0) {
              await tx.allergy.createMany({
                data: allergies.map((allergy) => ({
                  studentId: existing.id,
                  name: allergy.name,
                  severity: allergy.severity,
                })),
              })
            }
          }

          await tx.student.update({
            where: { id: existing.id },
            data: {
              firstName: nextFirst,
              lastName: nextLast,
              email: email ?? existing.email,
              grade,
              homeroom: row.homeroom?.trim() || undefined,
              ...(balance !== undefined ? { balance } : {}),
              ...(badgeStatus ? { badgeStatus } : {}),
              disabled: gradeInfo.shouldArchive ? true : false,
              ...photoUpdate,
              ...(hasDietaryColumn ? { dietaryRestrictions } : {}),
            },
          })
        })

        if (parentEmail) {
          await upsertParentLink({
            studentId: existing.id,
            email: parentEmail,
            name: resolveParentName(row, parentEmail),
            phone: row.parentPhone,
          })
        }

        result.updated += 1
        result.rowOutcomes.push({
          row: rowNumber,
          mdId,
          status: "updated",
          message: gradeInfo.fromEmail
            ? `Matched via ${match.via}; grade from email`
            : `Matched via ${match.via}`,
        })
        continue
      }

      if (!mdId) {
        mdId = await allocateNextMdId(input.schoolId)
      }

      const createBadgeStatus = badgeStatusToDb(
        gradeInfo.shouldArchive ? "inactive" : (explicitBadge ?? "active")
      )

      const student = await prisma.student.create({
        data: {
          externalId: mdId,
          barcode: mdId,
          badgeStatus: createBadgeStatus,
          firstName,
          lastName,
          email: email ?? null,
          grade,
          homeroom: row.homeroom?.trim() || undefined,
          balance: balance ?? 0,
          ...schoolPhotoWrite(photo),
          dietaryRestrictions,
          disabled: gradeInfo.shouldArchive,
          schoolId: input.schoolId,
          allergies: {
            create: allergiesToCreateInput(
              allergies.map((a) => ({ name: a.name, severity: "moderate" as const }))
            ),
          },
        },
      })

      if (parentEmail) {
        await upsertParentLink({
          studentId: student.id,
          email: parentEmail,
          name: resolveParentName(row, parentEmail),
          phone: row.parentPhone,
        })
      }

      await createAuditLog({
        action: "STUDENT_IMPORTED",
        entity: "student",
        entityType: "student",
        entityId: student.id,
        performedBy: input.performedBy,
        newValue: { externalId: mdId, email, grade, fromEmail: gradeInfo.fromEmail },
      })

      result.created += 1
      result.rowOutcomes.push({
        row: rowNumber,
        mdId,
        status: "created",
        message: gradeInfo.fromEmail
          ? "Created with grade from email"
          : "Created",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed"
      result.errors.push({
        row: rowNumber,
        message,
      })
      result.rowOutcomes.push({
        row: rowNumber,
        mdId: mdId || "",
        status: "error",
        message,
      })
    }
  }

  return result
}
