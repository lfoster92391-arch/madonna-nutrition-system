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

  await prisma.user.upsert({
    where: { email: "lisa.morris@madonnahs.org" },
    update: {
      username: "itlisa",
      firstName: "Lisa",
      lastName: "Morris",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      badgeId: "90010",
      phone: "555-1010",
      passwordHash,
      mustChangePassword: false,
      linkedStudentIds: [],
      schoolId: school.id,
    },
    create: {
      username: "itlisa",
      email: "lisa.morris@madonnahs.org",
      firstName: "Lisa",
      lastName: "Morris",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      badgeId: "90010",
      phone: "555-1010",
      passwordHash,
      mustChangePassword: false,
      schoolId: school.id,
    },
  })

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
    update: {},
    create: {
      schoolId: school.id,
      mainMealPrice: 3.0,
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
    },
    create: {
      schoolId: school.id,
      versionLabel: "V1",
      versionNumber: 1,
      status: "PUBLISHED",
      effectiveDate: new Date("2025-08-01"),
      expiresAt: new Date("2026-07-31"),
      content: DEFAULT_AGREEMENT_CONTENT,
      publishedAt: new Date(),
      publishedBy: "seed",
    },
  })

  console.log("Bootstrap seed completed for", school.name)
  console.log("Admin login username: itlisa")
  console.log("No demo students, staff, menus, or inventory were created.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
