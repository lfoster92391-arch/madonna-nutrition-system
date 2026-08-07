import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import { parentImportRequestSchema, parentImportRowSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { findStudentByExternalId } from "@/lib/db/students"
import { parseImportRows } from "@/lib/import-export/coerce"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = parentImportRequestSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid parent import payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const { valid, errors: parseErrors } = parseImportRows(
        parsed.data.rows,
        parentImportRowSchema,
        { rowNumberOffset: 1 }
      )

      let created = 0
      let linked = 0
      let matched = 0
      let updated = 0
      let skipped = parseErrors.length
      const errors = [...parseErrors]

      for (const item of valid) {
        const row = item.data
        const rowNumber = item.rowNumber
        const student = await findStudentByExternalId(row.mdId)
        if (!student || student.schoolId !== auth.schoolId) {
          errors.push({ row: rowNumber, message: `Student MD ID ${row.mdId} not found` })
          skipped++
          continue
        }

        const email = row.parentEmail.toLowerCase()
        const existingLink = await prisma.parentStudent.findFirst({
          where: {
            studentId: student.id,
            parent: { email },
          },
        })
        if (existingLink) {
          matched++
          updated++
        }

        const parent = await prisma.parent.upsert({
          where: { email },
          update: {
            name: row.parentName,
            phone: row.parentPhone ?? undefined,
          },
          create: {
            email,
            name: row.parentName,
            phone: row.parentPhone ?? null,
          },
        })

        created++

        await prisma.parentStudent.upsert({
          where: {
            parentId_studentId: {
              parentId: parent.id,
              studentId: student.id,
            },
          },
          update: {
            relationship: row.relationship ?? "Guardian",
          },
          create: {
            parentId: parent.id,
            studentId: student.id,
            relationship: row.relationship ?? "Guardian",
          },
        })

        linked++
      }

      return NextResponse.json({ created, linked, matched, updated, skipped, errors })
    } catch (error) {
      console.error("POST /api/imports/parents", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
