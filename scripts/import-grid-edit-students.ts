/**
 * Sync Madonna directory CSV (Student Name + Email #1) onto the roster and
 * provision STUDENT portal logins with a shared temporary password.
 *
 * Usage:
 *   npx tsx scripts/import-grid-edit-students.ts [path-to-csv]
 *
 * Defaults to c:/Users/LisaMorris/Downloads/grid-edit.csv
 * Requires DATABASE_URL (west-2 when .env points at Supabase us-west-2).
 *
 * Temp password: CSV Password when present; else Madonna26!
 * Override with STUDENT_TEMP_PASSWORD. Never logs plaintext passwords.
 */
import fs from "fs"
import path from "path"
import Papa from "papaparse"
import { PrismaClient } from "@prisma/client"
import { upsertStudentPortalAccount } from "../src/lib/auth/student-accounts"
import { refreshStudentGradesFromEmail } from "../src/lib/students/refresh-grades"
import { parseStudentDisplayName } from "../src/lib/students/grade-from-email"
import { STUDENT_EMAIL_DOMAIN } from "../src/config/academic-year"
import { asTrimmedString } from "../src/lib/import-export/coerce"
import { createAuditLog } from "../src/lib/db/audit"

const prisma = new PrismaClient()

const DEFAULT_TEMP_PASSWORD =
  process.env.STUDENT_TEMP_PASSWORD?.trim() || "Madonna26!"

type CsvRow = {
  studentName: string
  email: string
  password?: string
  rowNumber: number
}

type RosterStudent = {
  id: string
  externalId: string
  firstName: string
  lastName: string
  email: string | null
  disabled: boolean
}

async function resolveSchoolId(): Promise<string> {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))
  if (!school) throw new Error("No school found")
  return school.id
}

function isSchoolEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN}`)
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function nameKey(firstName: string, lastName: string): string {
  return `${normalizeKey(lastName)}|${normalizeKey(firstName)}`
}

function parseCsvRows(csvPath: string): CsvRow[] {
  const csvText = fs.readFileSync(csvPath, "utf8")
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const rows: CsvRow[] = []
  parsed.data.forEach((raw, index) => {
    const studentName =
      asTrimmedString(raw["Student Name"] ?? raw.studentName ?? raw.name ?? "") || ""
    const email =
      asTrimmedString(raw["Email #1"] ?? raw.email ?? raw.Email ?? "") || ""
    const password = asTrimmedString(raw.Password ?? raw.password ?? "") || undefined
    if (!studentName && !email) return
    rows.push({
      studentName,
      email: email.toLowerCase(),
      password: password || undefined,
      rowNumber: index + 2,
    })
  })
  return rows
}

async function main() {
  const csvPath =
    process.argv[2] ?? path.join("c:/Users/LisaMorris/Downloads/grid-edit.csv")

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`)
  }

  const csvRows = parseCsvRows(csvPath)
  console.log(`CSV path: ${csvPath}`)
  console.log(`CSV rows: ${csvRows.length}`)

  const schoolId = await resolveSchoolId()
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { slug: true, name: true },
  })
  console.log(`School: ${school?.name ?? schoolId} (${school?.slug ?? "no-slug"})`)

  const students = (await prisma.student.findMany({
    where: { schoolId },
    select: {
      id: true,
      externalId: true,
      firstName: true,
      lastName: true,
      email: true,
      disabled: true,
    },
  })) as RosterStudent[]
  console.log(`Roster students loaded: ${students.length}`)

  const byEmail = new Map<string, RosterStudent>()
  const byName = new Map<string, RosterStudent>()
  for (const student of students) {
    const email = student.email?.trim().toLowerCase()
    if (email) byEmail.set(email, student)
    byName.set(nameKey(student.firstName, student.lastName), student)
  }

  let emailsUpdated = 0
  let emailsAlreadyCurrent = 0
  let unmatched = 0
  let enabled = 0
  const matched: Array<{
    student: RosterStudent
    email: string
    password: string
    rowNumber: number
  }> = []
  const unmatchedSamples: string[] = []

  for (const row of csvRows) {
    if (!row.email || !isSchoolEmail(row.email)) {
      unmatched += 1
      if (unmatchedSamples.length < 10) {
        unmatchedSamples.push(`row ${row.rowNumber}: missing/invalid school email`)
      }
      continue
    }

    const parsedName = parseStudentDisplayName(row.studentName)
    const byExactEmail = byEmail.get(row.email)
    const byExactName =
      parsedName.firstName && parsedName.lastName
        ? byName.get(nameKey(parsedName.firstName, parsedName.lastName))
        : undefined

    let student = byExactName ?? byExactEmail
    if (!student) {
      unmatched += 1
      if (unmatchedSamples.length < 10) {
        unmatchedSamples.push(`row ${row.rowNumber}: ${row.studentName} <${row.email}>`)
      }
      continue
    }

    const currentEmail = student.email?.trim().toLowerCase() || ""
    const updates: { email?: string; disabled?: boolean } = {}
    if (currentEmail !== row.email) {
      updates.email = row.email
      emailsUpdated += 1
    } else {
      emailsAlreadyCurrent += 1
    }
    if (student.disabled) {
      updates.disabled = false
      enabled += 1
    }

    if (Object.keys(updates).length > 0) {
      await prisma.student.update({
        where: { id: student.id },
        data: updates,
      })
      student = {
        ...student,
        email: updates.email ?? student.email,
        disabled: updates.disabled === false ? false : student.disabled,
      }
      if (updates.email) {
        if (currentEmail) byEmail.delete(currentEmail)
        byEmail.set(row.email, student)
      }
    }

    matched.push({
      student,
      email: row.email,
      password: row.password?.trim() || DEFAULT_TEMP_PASSWORD,
      rowNumber: row.rowNumber,
    })
  }

  console.log("\nEmail sync:")
  console.log(
    JSON.stringify(
      {
        emailsUpdated,
        emailsAlreadyCurrent,
        unmatched,
        enabledForPortal: enabled,
        portalCandidates: matched.length,
      },
      null,
      2
    )
  )
  if (unmatchedSamples.length) {
    console.log("Unmatched samples:")
    for (const sample of unmatchedSamples) console.log(`  ${sample}`)
  }

  const csvPasswordCount = matched.filter(
    (r) => r.password !== DEFAULT_TEMP_PASSWORD
  ).length
  console.log(
    csvPasswordCount === 0
      ? `Temp password: shared default (${DEFAULT_TEMP_PASSWORD.length} chars), mustChangePassword=true`
      : `Temp password: ${csvPasswordCount} custom from CSV; rest use shared default`
  )

  let portalCreated = 0
  let portalUpdated = 0
  let portalSkipped = 0
  const portalErrors: string[] = []

  console.log(`\nProvisioning ${matched.length} student portal accounts…`)
  for (let i = 0; i < matched.length; i++) {
    const entry = matched[i]!
    if (i > 0 && i % 25 === 0) {
      console.log(`  … ${i}/${matched.length} (created=${portalCreated} updated=${portalUpdated} skipped=${portalSkipped})`)
    }

    try {
      const provisioned = await upsertStudentPortalAccount(prisma, {
        schoolId,
        schoolSlug: school?.slug,
        student: {
          externalId: entry.student.externalId,
          firstName: entry.student.firstName,
          lastName: entry.student.lastName,
          email: entry.email,
          disabled: false,
        },
        password: entry.password,
        mustChangePassword: true,
      })

      if (provisioned.action === "skipped") {
        portalSkipped += 1
        portalErrors.push(
          `row ${entry.rowNumber} ${entry.student.externalId}: skipped (non-student username/email conflict)`
        )
        continue
      }

      if (provisioned.action === "created") portalCreated += 1
      else portalUpdated += 1

      await createAuditLog({
        action: provisioned.action === "created" ? "USER_CREATED" : "PASSWORD_RESET",
        entity: "user",
        entityType: "user",
        entityId: provisioned.username,
        performedBy: "script:import-grid-edit-students",
        newValue: {
          username: provisioned.username,
          email: provisioned.email,
          role: "STUDENT",
          studentExternalId: entry.student.externalId,
          importSource: "grid-edit-csv",
          mustChangePassword: true,
          action: provisioned.action,
          temporaryPassword: true,
        },
      })
    } catch (error) {
      portalSkipped += 1
      const message = error instanceof Error ? error.message : "provision failed"
      portalErrors.push(`row ${entry.rowNumber} ${entry.student.externalId}: ${message}`)
    }
  }

  console.log("\nPortal provision:")
  console.log(
    JSON.stringify(
      {
        created: portalCreated,
        updated: portalUpdated,
        skipped: portalSkipped,
        errors: portalErrors.length,
        mustChangePassword: true,
      },
      null,
      2
    )
  )
  if (portalErrors.length) {
    console.log("Portal errors (sample):")
    for (const err of portalErrors.slice(0, 15)) console.log(`  ${err}`)
  }

  const refresh = await refreshStudentGradesFromEmail({
    schoolId,
    performedBy: "script:import-grid-edit-students",
  })
  console.log("\nGrade refresh:")
  console.log(
    JSON.stringify(
      {
        scanned: refresh.scanned,
        gradesUpdated: refresh.gradesUpdated,
        archived: refresh.archived,
        reactivated: refresh.reactivated,
        skippedNoEmail: refresh.skippedNoEmail,
        unchanged: refresh.unchanged,
      },
      null,
      2
    )
  )

  const portalUsers = await prisma.user.count({
    where: { schoolId, role: "STUDENT", mustChangePassword: true },
  })
  const portalUsersTotal = await prisma.user.count({
    where: { schoolId, role: "STUDENT" },
  })
  console.log(
    `\nSTUDENT portal users: ${portalUsersTotal} total, ${portalUsers} with mustChangePassword=true`
  )
  console.log(
    "Done. Students sign in at /login/student with school email + temporary password, then must change it."
  )
  console.log(
    JSON.stringify(
      {
        emailsUpdated,
        portalCreated,
        portalUpdated,
        portalSkipped,
      },
      null,
      2
    )
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
