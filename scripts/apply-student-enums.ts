import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function addEnumValue(typeName: string, value: string) {
  await prisma.$executeRawUnsafe(
    `DO $$ BEGIN
      ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`
  )
  console.log(`Ensured ${typeName}.${value}`)
}

async function main() {
  await addEnumValue("UserRole", "STUDENT")
  await addEnumValue("NotificationType", "STUDENT_LUNCH_ORDER")
  await addEnumValue("NotificationType", "MEAL_CHARGE")

  const roles = await prisma.$queryRawUnsafe<{ role: string }[]>(
    `SELECT unnest(enum_range(NULL::"UserRole"))::text AS role`
  )
  const types = await prisma.$queryRawUnsafe<{ ntype: string }[]>(
    `SELECT unnest(enum_range(NULL::"NotificationType"))::text AS ntype`
  )
  console.log("UserRole:", roles.map((r) => r.role).join(", "))
  console.log("NotificationType:", types.map((t) => t.ntype).join(", "))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
