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

      const source = await prisma.mealTemplate.findFirst({
        where: { id, schoolId },
        include: includeRelations,
      })
      if (!source) return notFound("Meal template not found")

      const duplicate = await prisma.mealTemplate.create({
        data: {
          name: `${source.name} (Copy)`,
          description: source.description,
          category: source.category,
          mealType: source.mealType,
          allergens: source.allergens,
          nutritionNotes: source.nutritionNotes,
          portionNotes: source.portionNotes,
          gradeAvailability: source.gradeAvailability,
          isFavorite: false,
          isPublished: false,
          isArchived: false,
          studentMealPrice: source.studentMealPrice,
          alaCartePrice: source.alaCartePrice,
          staffMealPrice: source.staffMealPrice,
          schoolId,
          items: {
            create: source.items.map((item) => ({
              name: item.name,
              sortOrder: item.sortOrder,
            })),
          },
          photos: {
            create: source.photos.map((photo) => ({
              slot: photo.slot,
              url: photo.url,
            })),
          },
        },
        include: includeRelations,
      })

      return NextResponse.json(mapMealTemplate(duplicate), { status: 201 })
    } catch (error) {
      console.error("POST /api/meal-templates/[id]/duplicate", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
