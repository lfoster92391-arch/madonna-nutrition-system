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

const LISA_EMAIL = "lisamorris@weirtonmadonna.org"
/** Previous seed email — migrate this account onto the canonical address when present. */
const LEGACY_LISA_EMAIL = "lisa.morris@madonnahs.org"
const LISA_USERNAME = "itlisa"
const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "FuelTheDons2026!"

async function main() {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))

  if (!school) {
    throw new Error("No school found. Run npm run db:seed first to create the school.")
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
  const existingByLegacyEmail =
    LEGACY_LISA_EMAIL === LISA_EMAIL
      ? null
      : await prisma.user.findUnique({ where: { email: LEGACY_LISA_EMAIL } })

  let user

  const mergeOnto = async (keepId, dropIds = []) => {
    const linkedStudentIds = new Set()
    const keep = await prisma.user.findUnique({ where: { id: keepId } })
    for (const id of keep?.linkedStudentIds ?? []) linkedStudentIds.add(id)
    for (const dropId of dropIds) {
      if (dropId === keepId) continue
      const drop = await prisma.user.findUnique({ where: { id: dropId } })
      for (const id of drop?.linkedStudentIds ?? []) linkedStudentIds.add(id)
      if (drop) await prisma.user.delete({ where: { id: dropId } })
    }
    return prisma.user.update({
      where: { id: keepId },
      data: { ...adminData, username: LISA_USERNAME, linkedStudentIds: [...linkedStudentIds] },
    })
  }

  const candidates = [existingByUsername, existingByEmail, existingByLegacyEmail].filter(Boolean)
  const uniqueIds = [...new Set(candidates.map((u) => u.id))]

  if (uniqueIds.length > 1) {
    const keepId = existingByUsername?.id ?? existingByEmail?.id ?? existingByLegacyEmail.id
    user = await mergeOnto(
      keepId,
      uniqueIds.filter((id) => id !== keepId)
    )
  } else if (uniqueIds.length === 1) {
    user = await mergeOnto(uniqueIds[0])
  } else {
    user = await prisma.user.create({
      data: { ...adminData, username: LISA_USERNAME },
    })
  }

  console.log("Lisa Morris admin account ready.")
  console.log("  User id:", user.id)
  console.log("  Username:", LISA_USERNAME, "(not display name — no spaces)")
  console.log("  Email:", LISA_EMAIL)
  console.log("  Login with username or email + seeded password.")
  console.log("  School:", school.name, `(${school.id})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
