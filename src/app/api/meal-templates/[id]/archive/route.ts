import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapMealTemplate } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { notFound, serverError, withDatabase } from "@/lib/api/response"

type RouteParams = { params: Promise<{ id: string }> }

const includeRelations = {
  items: { orderBy: { sortOrder: "asc" as const } },
  photos: true,
}

export async function POST(_request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const schoolId = await resolveSchoolId()

      const existing = await prisma.mealTemplate.findFirst({ where: { id, schoolId } })
      if (!existing) return notFound("Meal template not found")

      const template = await prisma.mealTemplate.update({
        where: { id },
        data: {
          isArchived: true,
          category: "archived",
          isPublished: false,
        },
        include: includeRelations,
      })

      return NextResponse.json(mapMealTemplate(template))
    } catch (error) {
      console.error("POST /api/meal-templates/[id]/archive", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
