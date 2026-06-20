import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapMealTemplate } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { mealTemplateSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"

type RouteParams = { params: Promise<{ id: string }> }

const includeRelations = {
  items: { orderBy: { sortOrder: "asc" as const } },
  photos: true,
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const schoolId = await resolveSchoolId()
      const body = await request.json()
      const parsed = mealTemplateSchema.partial().safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid meal template update", parsed.error.flatten())
      }

      const existing = await prisma.mealTemplate.findFirst({ where: { id, schoolId } })
      if (!existing) return notFound("Meal template not found")

      const data = parsed.data

      if (data.items) {
        await prisma.mealTemplateItem.deleteMany({ where: { mealTemplateId: id } })
      }
      if (data.photos) {
        await prisma.mealPhoto.deleteMany({ where: { mealTemplateId: id } })
      }

      const template = await prisma.mealTemplate.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          mealType: data.mealType,
          allergens: data.allergens,
          ingredients: data.ingredients,
          nutritionNotes: data.nutritionNotes,
          portionNotes: data.portionNotes,
          gradeAvailability: data.gradeAvailability,
          isReusable: data.isReusable,
          isFavorite: data.isFavorite,
          isPublished: data.isPublished,
          isArchived: data.isArchived,
          lastUsedAt: data.isArchived === false ? existing.lastUsedAt : existing.lastUsedAt,
          studentMealPrice: data.studentMealPrice,
          alaCartePrice: data.alaCartePrice,
          staffMealPrice: data.staffMealPrice,
          items: data.items
            ? {
                create: data.items.map((item) => ({
                  name: item.name,
                  sortOrder: item.sortOrder,
                })),
              }
            : undefined,
          photos: data.photos
            ? {
                create: data.photos.map((photo) => ({
                  slot: photo.slot,
                  url: photo.url,
                })),
              }
            : undefined,
        },
        include: includeRelations,
      })

      return NextResponse.json(mapMealTemplate(template))
    } catch (error) {
      console.error("PATCH /api/meal-templates/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
