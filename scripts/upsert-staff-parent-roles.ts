/**
 * Idempotent production/dev upsert for parent + workplace dual-role accounts.
 *
 *   npx tsx scripts/upsert-staff-parent-roles.ts
 *
 * New accounts have no password — use Admin → Staff Accounts → Reset password.
 * Existing passwords, student links, and itlisa / lisamorris are left unchanged.
 */
import { PrismaClient } from "@prisma/client"
import { upsertStaffParentAccounts } from "../src/lib/auth/staff-parent-accounts"

const prisma = new PrismaClient()

async function main() {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))

  if (!school) {
    throw new Error("No school found. Run npm run db:seed first to create the school.")
  }

  const results = await upsertStaffParentAccounts(prisma, school.id)
  console.log(`Staff-parent roles ready for ${school.name}.`)
  for (const row of results) {
    console.log(`  ${row.action}: ${row.email} (${row.username}) role=${row.role}`)
  }
  console.log("New accounts: reset password from Admin Staff Accounts. Do not invent a temp password here.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
