import { prisma } from "@/lib/prisma"
import { badgeStatusToDb } from "@/lib/db/mappers"
import { assertBarcodeAvailable, findStudentByExternalId } from "@/lib/db/students"
import type { badgeImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type BadgeImportRow = z.infer<typeof badgeImportRowSchema>

export interface BadgeImportError {
  row: number
  message: string
  mdId?: string
  incomplete?: boolean
}

export interface BadgeImportIncompleteRow {
  row: number
  mdId: string
  firstName: string
  lastName: string
  grade: string
  photoUrl?: string
  barcode?: string
  missing: string[]
}

export interface BadgeImportResult {
  matched: number
  updated: number
  created: number
  skipped: number
  incomplete: BadgeImportIncompleteRow[]
  errors: BadgeImportError[]
}

function normalizeStatus(raw?: string): "active" | "pending" | "inactive" {
  const value = raw?.trim().toLowerCase()
  if (value === "active") return "active"
  if (value === "inactive") return "inactive"
  return "pending"
}

function missingRequiredFields(row: BadgeImportRow): string[] {
  const missing: string[] = []
  if (!row.firstName?.trim()) missing.push("firstName")
  if (!row.lastName?.trim()) missing.push("lastName")
  if (!row.grade?.trim()) missing.push("grade")
  return missing
}

export async function importBadgeRows(input: {
  rows: BadgeImportRow[]
  schoolId: string
  createIncompleteStubs?: boolean
}): Promise<BadgeImportResult> {
  const result: BadgeImportResult = {
    matched: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    incomplete: [],
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

    const missing = missingRequiredFields(row)
    const barcode = row.barcode?.trim() || mdId
    const badgeStatus = normalizeStatus(row.badgeStatus)
    const existing = await findStudentByExternalId(mdId)

    // Incomplete row: existing students can still get barcode/photo/status updates.
    if (missing.length > 0) {
      if (existing) {
        result.matched += 1
        const conflict = await assertBarcodeAvailable(barcode, input.schoolId, existing.id)
        if (conflict) {
          result.errors.push({ row: rowNumber, mdId, message: conflict })
          continue
        }
        await prisma.student.update({
          where: { id: existing.id },
          data: {
            barcode,
            badgeStatus: badgeStatusToDb(badgeStatus),
            ...(row.photoUrl?.trim() ? { photo: row.photoUrl.trim() } : {}),
            ...(row.firstName?.trim() ? { firstName: row.firstName.trim() } : {}),
            ...(row.lastName?.trim() ? { lastName: row.lastName.trim() } : {}),
            ...(row.grade?.trim() ? { grade: row.grade.trim() } : {}),
          },
        })
        result.updated += 1
        continue
      }

      if (input.createIncompleteStubs) {
        const conflict = await assertBarcodeAvailable(barcode, input.schoolId)
        if (conflict) {
          result.errors.push({ row: rowNumber, mdId, message: conflict })
          continue
        }
        await prisma.student.create({
          data: {
            externalId: mdId,
            barcode,
            badgeStatus: "PENDING",
            firstName: row.firstName?.trim() || "(Needs edit)",
            lastName: row.lastName?.trim() || mdId,
            grade: row.grade?.trim() || "TBD",
            photo: row.photoUrl?.trim() || undefined,
            schoolId: input.schoolId,
          },
        })
        result.created += 1
        result.incomplete.push({
          row: rowNumber,
          mdId,
          firstName: row.firstName?.trim() || "",
          lastName: row.lastName?.trim() || "",
          grade: row.grade?.trim() || "",
          photoUrl: row.photoUrl?.trim() || undefined,
          barcode,
          missing,
        })
        continue
      }

      result.skipped += 1
      result.incomplete.push({
        row: rowNumber,
        mdId,
        firstName: row.firstName?.trim() || "",
        lastName: row.lastName?.trim() || "",
        grade: row.grade?.trim() || "",
        photoUrl: row.photoUrl?.trim() || undefined,
        barcode,
        missing,
      })
      result.errors.push({
        row: rowNumber,
        mdId,
        incomplete: true,
        message: `Incomplete — missing ${missing.join(", ")}. Import continued for other rows; edit this student individually.`,
      })
      continue
    }

    const conflict = await assertBarcodeAvailable(barcode, input.schoolId, existing?.id)
    if (conflict) {
      result.errors.push({ row: rowNumber, mdId, message: conflict })
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
          firstName: row.firstName!.trim(),
          lastName: row.lastName!.trim(),
          grade: row.grade!.trim(),
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
        firstName: row.firstName!.trim(),
        lastName: row.lastName!.trim(),
        grade: row.grade!.trim(),
        photo: row.photoUrl?.trim() || undefined,
        schoolId: input.schoolId,
      },
    })
    result.created += 1
  }

  return result
}
