/**
 * One-time production script: upsert Lisa Morris admin account only.
 *
 * Usage (set DATABASE_URL to production first):
 *   npx tsx scripts/seed-lisa-admin.mjs
 *
 * Or with custom password:
 *   ADMIN_SEED_PASSWORD='your-secret' npx tsx scripts/seed-lisa-admin.mjs
 */
import bcrypt from "bcryptjs"
import { PrismaClient, UserRole, UserStatus } from "@prisma/client"

const prisma = new PrismaClient()

const LISA_EMAIL = "lisa.morris@madonnahs.org"
const LISA_USERNAME = "itlisa"
const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "FuelTheDons2026!"

async function main() {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))

  if (!school) {
    throw new Error("No school found. Run full seed or create a school first.")
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const adminData = {
    email: LISA_EMAIL,
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
  }

  const existingByUsername = await prisma.user.findUnique({
    where: { username: LISA_USERNAME },
  })
  const existingByEmail = await prisma.user.findUnique({
    where: { email: LISA_EMAIL },
  })

  let user

  if (existingByUsername && existingByEmail && existingByUsername.id !== existingByEmail.id) {
    await prisma.user.delete({ where: { id: existingByEmail.id } })

    user = await prisma.user.update({
      where: { id: existingByUsername.id },
      data: adminData,
    })
  } else if (existingByUsername) {
    user = await prisma.user.update({
      where: { id: existingByUsername.id },
      data: adminData,
    })
  } else if (existingByEmail) {
    user = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { ...adminData, username: LISA_USERNAME },
    })
  } else {
    user = await prisma.user.create({
      data: { ...adminData, username: LISA_USERNAME },
    })
  }

  console.log("Lisa Morris admin account ready.")
  console.log("  User id:", user.id)
  console.log("  Username:", LISA_USERNAME, "(not display name — no spaces)")
  console.log("  Email:", LISA_EMAIL)
  console.log("  School:", school.name, `(${school.id})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
