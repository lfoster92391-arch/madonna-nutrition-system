import { prisma } from "@/lib/prisma"
import { allergiesToCreateInput } from "@/lib/db/mappers"
import { createAuditLog } from "@/lib/db/audit"
import { findStudentByExternalId } from "@/lib/db/students"
import type { studentImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type StudentImportRow = z.infer<typeof studentImportRowSchema>

export interface StudentImportError {
  row: number
  message: string
}

export interface StudentImportResult {
  matched: number
  created: number
  updated: number
  skipped: number
  errors: StudentImportError[]
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
  }

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]!
    const rowNumber = i + 1
    const mdId = row.mdId.trim()

    try {
      const existing = await findStudentByExternalId(mdId)
      const allergies = parseAllergies(row.allergies)
      const dietaryRestrictions = parseDietary(row.dietaryRestrictions)

      if (existing) {
        result.matched += 1
        if (!input.updateExisting) {
          result.skipped += 1
          continue
        }

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
              grade: row.grade.trim(),
              homeroom: row.homeroom?.trim() || undefined,
              balance: row.balance,
              photo: row.photoUrl?.trim() || undefined,
              dietaryRestrictions,
            },
          })
        })

        if (row.parentEmail?.trim()) {
          const email = row.parentEmail.trim().toLowerCase()
          const parent = await prisma.parent.upsert({
            where: { email },
            update: {
              phone: row.parentPhone?.trim() || undefined,
            },
            create: {
              email,
              name: email.split("@")[0] ?? "Parent",
              phone: row.parentPhone?.trim() || null,
            },
          })
          await prisma.parentStudent.upsert({
            where: {
              parentId_studentId: { parentId: parent.id, studentId: existing.id },
            },
            update: {},
            create: {
              parentId: parent.id,
              studentId: existing.id,
              relationship: "Guardian",
            },
          })
        }

        result.updated += 1
        continue
      }

      const student = await prisma.student.create({
        data: {
          externalId: mdId,
          barcode: mdId,
          badgeStatus: "PENDING",
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          grade: row.grade.trim(),
          homeroom: row.homeroom?.trim() || undefined,
          balance: row.balance,
          photo: row.photoUrl?.trim() || undefined,
          dietaryRestrictions,
          schoolId: input.schoolId,
          allergies: {
            create: allergiesToCreateInput(
              allergies.map((a) => ({ name: a.name, severity: "moderate" as const }))
            ),
          },
        },
      })

      if (row.parentEmail?.trim()) {
        const email = row.parentEmail.trim().toLowerCase()
        const parent = await prisma.parent.upsert({
          where: { email },
          update: {
            phone: row.parentPhone?.trim() || undefined,
          },
          create: {
            email,
            name: email.split("@")[0] ?? "Parent",
            phone: row.parentPhone?.trim() || null,
          },
        })
        await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relationship: "Guardian",
          },
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
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Import failed",
      })
    }
  }

  return result
}
