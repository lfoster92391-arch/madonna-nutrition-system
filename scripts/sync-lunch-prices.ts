/**
 * Align stored MAIN lunch prices to $7.00. Pizza Day rows (sliceCount set, or
 * "Pizza Day" in the name) are left at $1.00 / slice. A la carte is untouched.
 *
 * Usage (set DATABASE_URL / DIRECT_URL first):
 *   npm run db:sync-lunch-prices
 */
import { Prisma } from "@prisma/client"
import { PrismaClient } from "@prisma/client"

const MAIN_LUNCH = new Prisma.Decimal("7.00")
const prisma = new PrismaClient()

function isPizzaDayName(name?: string | null): boolean {
  if (!name) return false
  return /\bpizza\s*day\b/i.test(name.trim())
}

function todayUtcDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

async function main() {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))

  if (!school) {
    throw new Error("No school found.")
  }

  const today = todayUtcDate()
  console.log(`Syncing MAIN lunch prices to $7.00 for ${school.name} (from ${today.toISOString().slice(0, 10)}).`)

  const onboarding = await prisma.onboardingPricing.updateMany({
    where: { schoolId: school.id },
    data: { mainMealPrice: MAIN_LUNCH },
  })
  console.log(`OnboardingPricing mainMealPrice → 7.00 (${onboarding.count} row(s)).`)

  const templates = await prisma.mealTemplate.findMany({
    where: { schoolId: school.id },
    select: { id: true, name: true, category: true, studentMealPrice: true, staffMealPrice: true },
  })

  let templateCount = 0
  for (const template of templates) {
    if (isPizzaDayName(template.name)) continue
    const shouldTouch =
      template.category === "lunch" ||
      template.studentMealPrice != null ||
      template.staffMealPrice != null
    if (!shouldTouch) continue
    await prisma.mealTemplate.update({
      where: { id: template.id },
      data: {
        studentMealPrice: MAIN_LUNCH,
        staffMealPrice: MAIN_LUNCH,
      },
    })
    templateCount += 1
  }
  console.log(`MealTemplate student/staff lunch prices → 7.00 (${templateCount} row(s); Pizza Day skipped).`)

  const versions = await prisma.agreementVersion.findMany({
    where: { schoolId: school.id },
    select: { id: true, content: true },
  })
  let agreementCount = 0
  for (const version of versions) {
    const content = version.content
    if (!content || typeof content !== "object" || Array.isArray(content)) continue
    const next = structuredClone(content) as {
      pricing?: { mainMeal?: number }
    }
    if (!next.pricing) next.pricing = {}
    if (next.pricing.mainMeal === 7) continue
    next.pricing.mainMeal = 7
    await prisma.agreementVersion.update({
      where: { id: version.id },
      data: { content: next },
    })
    agreementCount += 1
  }
  console.log(`AgreementVersion pricing.mainMeal → 7 (${agreementCount} row(s)).`)

  const reservations = await prisma.lunchReservation.updateMany({
    where: {
      schoolId: school.id,
      mealType: "MAIN",
      date: { gte: today },
      sliceCount: null,
    },
    data: { price: MAIN_LUNCH, totalAmount: MAIN_LUNCH },
  })
  console.log(`LunchReservation MAIN (today/future, not Pizza Day) → 7.00 (${reservations.count} row(s)).`)

  const teacherRows = await prisma.teacherLunchReservation.findMany({
    where: { schoolId: school.id, date: { gte: today }, sliceCount: null },
    select: { id: true, mealName: true },
  })
  let teacherCount = 0
  for (const row of teacherRows) {
    if (isPizzaDayName(row.mealName)) continue
    await prisma.teacherLunchReservation.update({
      where: { id: row.id },
      data: { mealPrice: MAIN_LUNCH, totalAmount: MAIN_LUNCH },
    })
    teacherCount += 1
  }
  console.log(`TeacherLunchReservation (today/future, not Pizza Day) → 7.00 (${teacherCount} row(s)).`)

  const signups = await prisma.studentLunchSignup.findMany({
    where: { schoolId: school.id, date: { gte: today } },
    select: { id: true, mealName: true },
  })
  let signupCount = 0
  for (const row of signups) {
    if (isPizzaDayName(row.mealName)) continue
    await prisma.studentLunchSignup.update({
      where: { id: row.id },
      data: { mealPrice: MAIN_LUNCH },
    })
    signupCount += 1
  }
  console.log(`StudentLunchSignup (today/future, not Pizza Day) → 7.00 (${signupCount} row(s)).`)

  console.log("Done. A la carte / milk / Pizza Day slice prices were not changed.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
