/**
 * Idempotent upsert: Brenda Chartier admin for multi-portal preview
 * (admin / parent / teacher / staff / student), same pattern as Lisa (#78).
 *
 * Usage (set DATABASE_URL first):
 *   npx tsx scripts/upsert-chartier-admin.mjs
 *
 * New accounts (or accounts with no password) get the school default password.
 * Existing passwords are kept. Does not touch itlisa / lisamorris.
 */
import bcrypt from "bcryptjs"
import { PrismaClient, UserRole, UserStatus } from "@prisma/client"

const prisma = new PrismaClient()

const CHARTIER_EMAIL = "bchartier@weirtonmadonna.org"
const CHARTIER_USERNAME = "bchartier"
const DEFAULT_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "FuelTheDons2026!"

/** Never modify these accounts from this script. */
const PROTECTED = new Set(["itlisa", "lisamorris@weirtonmadonna.org"])

async function main() {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))

  if (!school) {
    throw new Error("No school found. Run npm run db:seed first to create the school.")
  }

  const existingByUsername = await prisma.user.findUnique({
    where: { username: CHARTIER_USERNAME },
  })
  const existingByEmail = await prisma.user.findUnique({
    where: { email: CHARTIER_EMAIL },
  })

  for (const row of [existingByUsername, existingByEmail]) {
    if (!row) continue
    const email = row.email.trim().toLowerCase()
    const username = row.username.trim().toLowerCase()
    if (PROTECTED.has(username) || PROTECTED.has(email)) {
      throw new Error(
        `Refusing to modify protected account ${row.username} / ${row.email}`
      )
    }
  }

  const baseData = {
    email: CHARTIER_EMAIL,
    firstName: "Brenda",
    lastName: "Chartier",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    mustChangePassword: false,
    schoolId: school.id,
  }

  const candidates = [existingByUsername, existingByEmail].filter(Boolean)
  const uniqueIds = [...new Set(candidates.map((u) => u.id))]

  let user
  let action

  if (uniqueIds.length === 0) {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    user = await prisma.user.create({
      data: {
        ...baseData,
        username: CHARTIER_USERNAME,
        passwordHash,
        linkedStudentIds: [],
        badgeId: null,
        phone: null,
      },
    })
    action = "created"
  } else {
    const keepId =
      existingByUsername?.id ?? existingByEmail?.id ?? uniqueIds[0]
    const dropIds = uniqueIds.filter((id) => id !== keepId)

    const keep = await prisma.user.findUnique({ where: { id: keepId } })
    const linkedStudentIds = new Set(keep?.linkedStudentIds ?? [])
    for (const dropId of dropIds) {
      const drop = await prisma.user.findUnique({ where: { id: dropId } })
      for (const id of drop?.linkedStudentIds ?? []) linkedStudentIds.add(id)
      await prisma.user.delete({ where: { id: dropId } })
    }

    const needsPassword = !keep?.passwordHash
    const passwordHash = needsPassword
      ? await bcrypt.hash(DEFAULT_PASSWORD, 10)
      : undefined

    user = await prisma.user.update({
      where: { id: keepId },
      data: {
        ...baseData,
        username: CHARTIER_USERNAME,
        linkedStudentIds: [...linkedStudentIds],
        ...(passwordHash ? { passwordHash } : {}),
      },
    })
    action = needsPassword ? "updated_with_password" : "updated_kept_password"
  }

  console.log("Chartier admin account ready.")
  console.log("  Action:", action)
  console.log("  User id:", user.id)
  console.log("  Username:", CHARTIER_USERNAME)
  console.log("  Email:", CHARTIER_EMAIL)
  console.log("  Role: ADMIN (multi-portal preview like Lisa)")
  console.log("  School:", school.name, `(${school.id})`)
  if (action === "created" || action === "updated_with_password") {
    console.log("  Password: school default was set (not printed).")
  } else {
    console.log("  Password: left unchanged.")
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
