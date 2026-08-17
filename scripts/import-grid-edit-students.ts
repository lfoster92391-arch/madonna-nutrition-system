/**
 * Import Madonna directory CSV (Student Name + Email) and refresh grades from email.
 *
 * Usage:
 *   npx tsx scripts/import-grid-edit-students.ts [path-to-csv]
 *
 * Defaults to c:/Users/LisaMorris/Downloads/grid-edit.csv
 * Requires DATABASE_URL (and DIRECT_URL for schema push if needed).
 */
import fs from "fs"
import path from "path"
import Papa from "papaparse"
import { PrismaClient } from "@prisma/client"
import { importStudentRows } from "../src/lib/admin/student-import"
import { refreshStudentGradesFromEmail } from "../src/lib/students/refresh-grades"
import { normalizeStudentImportRow, parseImportRows } from "../src/lib/import-export/coerce"
import { studentImportRowSchema } from "../src/lib/api/validation"

const prisma = new PrismaClient()

async function resolveSchoolId(): Promise<string> {
  const school =
    (await prisma.school.findFirst({ where: { slug: "madonna-high-school" } })) ??
    (await prisma.school.findFirst({ orderBy: { createdAt: "asc" } }))
  if (!school) throw new Error("No school found")
  return school.id
}

async function main() {
  const csvPath =
    process.argv[2] ??
    path.join("c:/Users/LisaMorris/Downloads/grid-edit.csv")

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`)
  }

  const csvText = fs.readFileSync(csvPath, "utf8")
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const { valid, errors: parseErrors } = parseImportRows(
    parsed.data,
    studentImportRowSchema,
    { rowNumberOffset: 2, normalizeRow: normalizeStudentImportRow }
  )

  console.log(`CSV rows: ${parsed.data.length}`)
  console.log(`Valid rows: ${valid.length}`)
  console.log(`Parse errors: ${parseErrors.length}`)
  for (const err of parseErrors.slice(0, 20)) {
    console.log(`  row ${err.row}: ${err.message}`)
  }

  const schoolId = await resolveSchoolId()

  const summary = await importStudentRows({
    rows: valid.map((row) => ({
      ...(row.data as object),
      _rowNumber: row.rowNumber,
    })) as import("../src/lib/admin/student-import").StudentImportRow[],
    schoolId,
    performedBy: "script:import-grid-edit-students",
    updateExisting: true,
  })

  console.log("\nImport summary:")
  console.log(
    JSON.stringify(
      {
        matched: summary.matched,
        created: summary.created,
        updated: summary.updated,
        skipped: summary.skipped,
        errors: summary.errors.length,
      },
      null,
      2
    )
  )

  const created = summary.rowOutcomes.filter((r) => r.status === "created")
  const updated = summary.rowOutcomes.filter((r) => r.status === "updated")
  const errored = summary.rowOutcomes.filter((r) => r.status === "error")

  console.log(`\nCreated (${created.length}):`)
  for (const row of created) {
    console.log(`  ${row.mdId} — ${row.message ?? ""}`)
  }

  console.log(`\nUpdated sample (${Math.min(5, updated.length)} of ${updated.length}):`)
  for (const row of updated.slice(0, 5)) {
    console.log(`  ${row.mdId} — ${row.message ?? ""}`)
  }

  if (errored.length) {
    console.log(`\nErrors (${errored.length}):`)
    for (const row of errored) {
      console.log(`  row ${row.row} ${row.mdId}: ${row.message}`)
    }
  }

  const refresh = await refreshStudentGradesFromEmail({
    schoolId,
    performedBy: "script:import-grid-edit-students",
  })

  console.log("\nGrade refresh:")
  console.log(
    JSON.stringify(
      {
        seniorGraduationYear: refresh.seniorGraduationYear,
        scanned: refresh.scanned,
        gradesUpdated: refresh.gradesUpdated,
        archived: refresh.archived,
        reactivated: refresh.reactivated,
        skippedNoEmail: refresh.skippedNoEmail,
        skippedUnparseable: refresh.skippedUnparseable,
        unchanged: refresh.unchanged,
      },
      null,
      2
    )
  )

  if (refresh.archived > 0) {
    console.log("\nArchived:")
    for (const d of refresh.details.filter((x) => x.action === "archived")) {
      console.log(`  ${d.mdId} ${d.email} — ${d.message}`)
    }
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
