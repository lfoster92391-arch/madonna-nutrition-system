import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"

const DEFAULT_SCHOOL_SLUG = "madonna-high-school"

let cachedSchoolId: string | null = null

export function getSchoolSlug(): string {
  return process.env.SCHOOL_SLUG?.trim() || DEFAULT_SCHOOL_SLUG
}

export async function resolveSchoolId(): Promise<string> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const fromEnv = process.env.SCHOOL_ID?.trim()
  if (fromEnv) return fromEnv

  if (cachedSchoolId) return cachedSchoolId

  const slug = getSchoolSlug()
  const school = await prisma.school.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!school) {
    throw new Error(
      `No school found for slug "${slug}". Run npm run db:seed or set SCHOOL_ID.`
    )
  }

  cachedSchoolId = school.id
  return school.id
}
