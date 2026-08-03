import { prisma } from "@/lib/prisma"
import { allergiesToCreateInput, badgeStatusToDb } from "@/lib/db/mappers"
import { createAuditLog } from "@/lib/db/audit"
import { findStudentByExternalId } from "@/lib/db/students"
import type { studentImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type StudentImportRow = z.infer<typeof studentImportRowSchema> & { _rowNumber?: number }

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
  return raw.split(/[,;]/).map((item) => item.trim()).filter(Boolean)
}

function resolvePhoto(row: StudentImportRow): string | undefined {
  const fromUrl = row.photoUrl?.trim()
  if (fromUrl) return fromUrl
  const fromPhoto = row.photo?.trim()
  return fromPhoto || undefined
}

function resolveParentName(row: StudentImportRow, email: string): string {
  const named = row.parentName?.trim() || row.parent?.trim()
  if (named) return named
  return email.split("@")[0] ?? "Parent"
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
    const mdId = row.mdId.trim()

    try {
      const existing = await findStudentByExternalId(mdId)
      const allergies = parseAllergies(row.allergies)
      const dietaryRestrictions = parseDietary(row.dietaryRestrictions)
      const photo = resolvePhoto(row)
      const badgeStatus = badgeStatusToDb(row.badgeStatus ?? "active")
      const grade = row.grade?.trim() ?? ""
      const balance = row.balance ?? 0
      const parentEmail = row.parentEmail?.trim().toLowerCase()

      if (existing) {
        result.matched += 1
        if (!input.updateExisting) {
          result.skipped += 1
          result.rowOutcomes.push({
            row: rowNumber,
            mdId,
            status: "skipped",
            message: "Existing student — update not enabled",
          })
          continue
        }

        const photoUpdate = photo ? { photo } : {}

        await prisma.$transaction(async (tx) => {
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

          await tx.student.update({
            where: { id: existing.id },
            data: {
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              grade,
              homeroom: row.homeroom?.trim() || undefined,
              balance,
              badgeStatus,
              ...photoUpdate,
              dietaryRestrictions,
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
        result.rowOutcomes.push({ row: rowNumber, mdId, status: "updated" })
        continue
      }

      const student = await prisma.student.create({
        data: {
          externalId: mdId,
          barcode: mdId,
          badgeStatus,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          grade,
          homeroom: row.homeroom?.trim() || undefined,
          balance,
          photo,
          dietaryRestrictions,
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
        newValue: { externalId: mdId },
      })

      result.created += 1
      result.rowOutcomes.push({ row: rowNumber, mdId, status: "created" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed"
      result.errors.push({
        row: rowNumber,
        message,
      })
      result.rowOutcomes.push({ row: rowNumber, mdId, status: "error", message })
    }
  }

  return result
}
