import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapMedicalDocument } from "@/lib/db/mappers"
import { findStudentByExternalId } from "@/lib/db/students"
import { addOneYear } from "@/lib/food-safety"
import { resolveSchoolId } from "@/lib/db/school"
import { medicalDocumentSchema, parentContactUpdateSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const documents = await prisma.medicalDocument.findMany({
      where: { student: { schoolId } },
      include: { student: { select: { externalId: true } } },
      orderBy: { uploadedAt: "desc" },
    })
    return NextResponse.json(
      documents.map((d) => mapMedicalDocument(d, d.student.externalId))
    )
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = medicalDocumentSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid medical document", parsed.error.flatten())
      }

      const student = await findStudentByExternalId(parsed.data.studentId)
      if (!student) return notFound("Student not found")

      const existing = await prisma.medicalDocument.findMany({
        where: { studentId: student.id },
        select: { version: true },
      })
      const maxVersion = existing.reduce((max, d) => Math.max(max, d.version), 0)

      const doc = await prisma.medicalDocument.create({
        data: {
          studentId: student.id,
          documentUrl: parsed.data.documentUrl,
          fileName: parsed.data.fileName,
          version: maxVersion + 1,
          uploadedBy: parsed.data.uploadedBy,
          expiresAt: addOneYear(),
        },
        include: { student: { select: { externalId: true } } },
      })

      return NextResponse.json(mapMedicalDocument(doc, doc.student.externalId), { status: 201 })
    } catch (error) {
      console.error("POST /api/medical-documents", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function PATCH(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const studentId = body.studentId as string | undefined
      const parsed = parentContactUpdateSchema.safeParse(body.contact ?? body)
      if (!studentId || !parsed.success) {
        return badRequest("Invalid parent contact update", parsed.success ? undefined : parsed.error.flatten())
      }

      const student = await findStudentByExternalId(studentId)
      if (!student) return notFound("Student not found")

      const contact = parsed.data
      const existingLink = student.parentLinks[0]

      if (existingLink) {
        await prisma.parent.update({
          where: { id: existingLink.parentId },
          data: {
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
          },
        })
      } else {
        const parent = await prisma.parent.upsert({
          where: { email: contact.email },
          update: { name: contact.name, phone: contact.phone },
          create: { email: contact.email, name: contact.name, phone: contact.phone },
        })
        await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relationship: "Guardian",
          },
        })
      }

      const updated = await findStudentByExternalId(studentId)
      return NextResponse.json({ success: true, studentId, contact })
    } catch (error) {
      console.error("PATCH /api/medical-documents (parent contact)", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
