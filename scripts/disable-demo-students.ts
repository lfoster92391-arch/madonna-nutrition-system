/**
 * One-time production script: disable all seed/demo students in the database.
 *
 * Usage (set DIRECT_URL or DATABASE_URL to production first):
 *   npm run db:disable-demo-students
 *
 * Keeps rows for audit/history but hides them from badge roster, admin lists, and scans.
 */
import { PrismaClient } from "@prisma/client"
import { DEMO_STUDENT_EXTERNAL_IDS } from "../src/config/demo-students"

const prisma = new PrismaClient()

async function main() {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))

  if (!school) {
    throw new Error("No school found.")
  }

  const result = await prisma.student.updateMany({
    where: {
      schoolId: school.id,
      externalId: { in: [...DEMO_STUDENT_EXTERNAL_IDS] },
    },
    data: { disabled: true },
  })

  const disabled = await prisma.student.findMany({
    where: {
      schoolId: school.id,
      externalId: { in: [...DEMO_STUDENT_EXTERNAL_IDS] },
      disabled: true,
    },
    select: { externalId: true, firstName: true, lastName: true },
    orderBy: { externalId: "asc" },
  })

  console.log(`Disabled ${result.count} demo student(s) for ${school.name}.`)
  for (const s of disabled) {
    console.log(`  ${s.externalId} — ${s.firstName} ${s.lastName}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
