import { prisma } from "@/lib/prisma"
import { badgeStatusToDb } from "@/lib/db/mappers"
import { assertBarcodeAvailable, findStudentByExternalId } from "@/lib/db/students"
import type { badgeImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type BadgeImportRow = z.infer<typeof badgeImportRowSchema>

export interface BadgeImportError {
  row: number
  message: string
}

export interface BadgeImportResult {
  matched: number
  updated: number
  created: number
  skipped: number
  errors: BadgeImportError[]
}

function normalizeStatus(raw?: string): "active" | "pending" | "inactive" {
  const value = raw?.trim().toLowerCase()
  if (value === "active") return "active"
  if (value === "inactive") return "inactive"
  return "pending"
}

export async function importBadgeRows(input: {
  rows: BadgeImportRow[]
  schoolId: string
}): Promise<BadgeImportResult> {
  const result: BadgeImportResult = {
    matched: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    errors: [],
  }

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]!
    const rowNumber = i + 2
    const mdId = row.mdId.trim()
    if (!mdId) {
      result.skipped += 1
      result.errors.push({ row: rowNumber, message: "MD ID is required" })
      continue
    }
    if (!row.firstName.trim() || !row.lastName.trim() || !row.grade.trim()) {
      result.skipped += 1
      result.errors.push({
        row: rowNumber,
        message: "First name, last name, and grade are required",
      })
      continue
    }

    const barcode = row.barcode?.trim() || mdId
    const badgeStatus = normalizeStatus(row.badgeStatus)
    const existing = await findStudentByExternalId(mdId)

    const conflict = await assertBarcodeAvailable(
      barcode,
      input.schoolId,
      existing?.id
    )
    if (conflict) {
      result.errors.push({ row: rowNumber, message: conflict })
      continue
    }

    if (existing) {
      result.matched += 1
      await prisma.student.update({
        where: { id: existing.id },
        data: {
          barcode,
          badgeStatus: badgeStatusToDb(badgeStatus),
          ...(row.photoUrl?.trim() ? { photo: row.photoUrl.trim() } : {}),
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          grade: row.grade.trim(),
        },
      })
      result.updated += 1
      continue
    }

    await prisma.student.create({
      data: {
        externalId: mdId,
        barcode,
        badgeStatus: badgeStatusToDb(badgeStatus),
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        grade: row.grade.trim(),
        photo: row.photoUrl?.trim() || undefined,
        schoolId: input.schoolId,
      },
    })
    result.created += 1
  }

  return result
}
