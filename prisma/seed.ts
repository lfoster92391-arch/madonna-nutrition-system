/**
 * Bootstrap seed — school identity, primary admin, calendar defaults, agreement.
 * Does NOT create demo students, parents, inventory, vendors, or fake portal users.
 * Real roster data comes from SIS / Family Import.
 *
 * Prefer `npm run db:seed-lisa` on an existing school if you only need the admin account.
 */
import bcrypt from "bcryptjs"
import { PrismaClient, UserRole, UserStatus } from "@prisma/client"
import { DEFAULT_AGREEMENT_CONTENT } from "../src/config/agreement-defaults"
import { DEFAULT_CALENDAR_SETTINGS } from "../src/config/calendar-defaults"

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "FuelTheDons2026!"

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const school = await prisma.school.upsert({
    where: { slug: "madonna-high-school" },
    update: {
      name: "Madonna High School",
      primaryColor: "#001E62",
      secondaryColor: "#C8CDD7",
    },
    create: {
      name: "Madonna High School",
      slug: "madonna-high-school",
      primaryColor: "#001E62",
      secondaryColor: "#C8CDD7",
    },
  })

  console.log("School ID (set SCHOOL_ID on Vercel):", school.id)

  const adminEmail = "lisamorris@weirtonmadonna.org"
  const legacyAdminEmail = "lisa.morris@madonnahs.org"
  const adminUsername = "itlisa"
  const adminData = {
    email: adminEmail,
    username: adminUsername,
    firstName: "Lisa",
    lastName: "Morris",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    badgeId: "90010",
    phone: "555-1010",
    passwordHash,
    mustChangePassword: false,
    linkedStudentIds: [] as string[],
    schoolId: school.id,
  }

  const existingByUsername = await prisma.user.findUnique({ where: { username: adminUsername } })
  const existingByEmail = await prisma.user.findUnique({ where: { email: adminEmail } })
  const existingByLegacyEmail = await prisma.user.findUnique({
    where: { email: legacyAdminEmail },
  })

  const candidates = [existingByUsername, existingByEmail, existingByLegacyEmail].filter(Boolean)
  const uniqueIds = [...new Set(candidates.map((u) => u!.id))]

  if (uniqueIds.length > 1) {
    const keepId = existingByUsername?.id ?? existingByEmail?.id ?? existingByLegacyEmail!.id
    const linkedStudentIds = new Set<string>()
    for (const candidate of candidates) {
      for (const id of candidate!.linkedStudentIds ?? []) linkedStudentIds.add(id)
    }
    for (const id of uniqueIds) {
      if (id !== keepId) await prisma.user.delete({ where: { id } })
    }
    await prisma.user.update({
      where: { id: keepId },
      data: { ...adminData, linkedStudentIds: [...linkedStudentIds] },
    })
  } else if (uniqueIds.length === 1) {
    await prisma.user.update({
      where: { id: uniqueIds[0] },
      data: adminData,
    })
  } else {
    await prisma.user.create({ data: adminData })
  }

  await prisma.calendarSettings.upsert({
    where: { schoolId: school.id },
    update: {
      headerTitle: DEFAULT_CALENDAR_SETTINGS.headerTitle,
      bannerMessage: DEFAULT_CALENDAR_SETTINGS.bannerMessage,
      accentColor: DEFAULT_CALENDAR_SETTINGS.accentColor,
      schoolName: DEFAULT_CALENDAR_SETTINGS.schoolName,
    },
    create: {
      schoolId: school.id,
      headerTitle: DEFAULT_CALENDAR_SETTINGS.headerTitle,
      bannerMessage: DEFAULT_CALENDAR_SETTINGS.bannerMessage,
      accentColor: DEFAULT_CALENDAR_SETTINGS.accentColor,
      schoolName: DEFAULT_CALENDAR_SETTINGS.schoolName,
    },
  })

  await prisma.onboardingPricing.upsert({
    where: { schoolId: school.id },
    update: { mainMealPrice: 7.0 },
    create: {
      schoolId: school.id,
      mainMealPrice: 7.0,
      sideMealPrice: 2.0,
      alaCartePrice: 4.5,
      milkPrice: 0.75,
      agreementText:
        "Madonna High School Food Services Agreement — parents maintain accurate dietary info and current cafeteria balances.",
      emergencyPolicyText:
        "Emergency Policy — staff follow approved allergy care plans and contact guardians immediately.",
    },
  })

  await prisma.agreementVersion.upsert({
    where: { schoolId_versionNumber: { schoolId: school.id, versionNumber: 1 } },
    update: {
      status: "PUBLISHED",
      content: DEFAULT_AGREEMENT_CONTENT,
      expiresAt: null,
    },
    create: {
      schoolId: school.id,
      versionLabel: "V1",
      versionNumber: 1,
      status: "PUBLISHED",
      effectiveDate: new Date("2025-08-01"),
      expiresAt: null,
      content: DEFAULT_AGREEMENT_CONTENT,
      publishedAt: new Date(),
      publishedBy: "seed",
    },
  })

  console.log("Bootstrap seed completed for", school.name)
  console.log("Admin login: username itlisa OR email lisamorris@weirtonmadonna.org")
  console.log("No demo students, staff, menus, or inventory were created.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
