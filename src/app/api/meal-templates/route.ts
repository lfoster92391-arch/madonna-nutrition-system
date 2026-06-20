import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapMealTemplate } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { mealTemplateSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

const includeRelations = {
  items: { orderBy: { sortOrder: "asc" as const } },
  photos: true,
}

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const templates = await prisma.mealTemplate.findMany({
      where: { schoolId },
      include: includeRelations,
      orderBy: [{ isArchived: "asc" }, { updatedAt: "desc" }],
    })
    return NextResponse.json(templates.map(mapMealTemplate))
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = mealTemplateSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid meal template", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const data = parsed.data

      const template = await prisma.mealTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          mealType: data.mealType,
          allergens: data.allergens ?? [],
          ingredients: data.ingredients ?? undefined,
          nutritionNotes: data.nutritionNotes,
          portionNotes: data.portionNotes,
          gradeAvailability: data.gradeAvailability ?? [],
          isReusable: data.isReusable ?? true,
          isFavorite: data.isFavorite ?? false,
          isPublished: data.isPublished ?? false,
          isArchived: data.isArchived ?? false,
          studentMealPrice: data.studentMealPrice,
          alaCartePrice: data.alaCartePrice,
          staffMealPrice: data.staffMealPrice,
          schoolId,
          items: {
            create: (data.items ?? []).map((item) => ({
              name: item.name,
              sortOrder: item.sortOrder,
            })),
          },
          photos: {
            create: (data.photos ?? []).map((photo) => ({
              slot: photo.slot,
              url: photo.url,
            })),
          },
        },
        include: includeRelations,
      })

      return NextResponse.json(mapMealTemplate(template), { status: 201 })
    } catch (error) {
      console.error("POST /api/meal-templates", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
