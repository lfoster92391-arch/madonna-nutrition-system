import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"
import { getSchoolSlug } from "@/lib/db/school"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Deployment diagnostics for the database. Returns a sanitized, secret-free
 * report so operators can tell exactly why "Database request failed." appears:
 * missing DATABASE_URL, unreachable DB, un-migrated schema, or un-seeded data.
 */
export async function GET() {
  if (!isDatabaseEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        stage: "config",
        message:
          "DATABASE_URL is not set. Add DATABASE_URL (and DIRECT_URL) to your environment and redeploy.",
      },
      { status: 503 }
    )
  }

  // 1) Connectivity
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    return NextResponse.json(
      {
        ok: false,
        stage: "connect",
        message:
          "Cannot connect to the database. Verify DATABASE_URL/DIRECT_URL credentials, host, and SSL settings (Supabase: pooled 6543 with ?pgbouncer=true for DATABASE_URL, direct 5432 for DIRECT_URL), and that the database is running.",
      },
      { status: 503 }
    )
  }

  // 2) Schema + seed
  const slug = getSchoolSlug()
  try {
    const school = await prisma.school.findUnique({
      where: { slug },
      select: { id: true, name: true },
    })

    if (!school) {
      const schoolCount = await prisma.school.count()
      return NextResponse.json(
        {
          ok: false,
          stage: "seed",
          slug,
          message:
            schoolCount > 0
              ? `Connected, but no school matches SCHOOL_SLUG "${slug}". Set SCHOOL_SLUG or SCHOOL_ID to an existing school.`
              : 'Connected and migrated, but not seeded. Run "npm run db:seed" (with DIRECT_URL set) to create the school and admin accounts.',
        },
        { status: 503 }
      )
    }

    const [users, admins] = await Promise.all([
      prisma.user.count({ where: { schoolId: school.id } }),
      prisma.user.count({ where: { schoolId: school.id, role: "ADMIN" } }),
    ])

    return NextResponse.json({
      ok: true,
      stage: "ready",
      slug,
      school: school.name,
      users,
      admins,
      message: "Database is connected, migrated, and seeded.",
    })
  } catch (error) {
    const code = (error as { code?: string })?.code
    const missingTables =
      code === "P2021" ||
      (error instanceof Error && /does not exist/i.test(error.message))
    if (missingTables) {
      return NextResponse.json(
        {
          ok: false,
          stage: "schema",
          message:
            'Connected, but database tables are missing. Run "npx prisma db push" (or "npx prisma migrate deploy") against this database, then "npm run db:seed".',
        },
        { status: 503 }
      )
    }
    return NextResponse.json(
      {
        ok: false,
        stage: "error",
        message: "Database query failed. Check the server logs for the underlying error.",
      },
      { status: 500 }
    )
  }
}
