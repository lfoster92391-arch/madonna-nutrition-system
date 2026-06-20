import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import type { vendorImportRowSchema } from "@/lib/api/validation"
import type { z } from "zod"

export type VendorImportRow = z.infer<typeof vendorImportRowSchema>

export interface VendorRecord {
  id: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  category?: string
  active: boolean
}

export interface VendorImportError {
  row: number
  message: string
}

export interface VendorImportResult {
  created: number
  updated: number
  skipped: number
  errors: VendorImportError[]
}

export function mapVendor(vendor: {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  category: string | null
  active: boolean
}): VendorRecord {
  return {
    id: vendor.id,
    name: vendor.name,
    contactName: vendor.contactName ?? undefined,
    email: vendor.email ?? undefined,
    phone: vendor.phone ?? undefined,
    category: vendor.category ?? undefined,
    active: vendor.active,
  }
}

export async function listVendors(): Promise<VendorRecord[]> {
  const schoolId = await resolveSchoolId()
  const vendors = await prisma.vendor.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
  })
  return vendors.map(mapVendor)
}

export async function importVendorRows(input: {
  rows: VendorImportRow[]
  schoolId: string
}): Promise<VendorImportResult> {
  const result: VendorImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  for (let i = 0; i < input.rows.length; i++) {
    const row = input.rows[i]!
    const rowNumber = i + 1
    const name = row.name.trim()

    try {
      const existing = await prisma.vendor.findUnique({
        where: { schoolId_name: { schoolId: input.schoolId, name } },
      })

      const data = {
        contactName: row.contactName?.trim() || undefined,
        email: row.email?.trim() || undefined,
        phone: row.phone?.trim() || undefined,
        category: row.category?.trim() || undefined,
        active: row.active ?? true,
      }

      if (existing) {
        await prisma.vendor.update({
          where: { id: existing.id },
          data,
        })
        result.updated += 1
      } else {
        await prisma.vendor.create({
          data: {
            name,
            ...data,
            schoolId: input.schoolId,
          },
        })
        result.created += 1
      }
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Import failed",
      })
    }
  }

  return result
}
