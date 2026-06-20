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

  const user = await prisma.user.upsert({
    where: { email: LISA_EMAIL },
    update: {
      username: LISA_USERNAME,
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
    create: {
      username: LISA_USERNAME,
      email: LISA_EMAIL,
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
