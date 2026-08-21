/**
 * MD ID / scan matching assertions (no test runner required).
 *   npx tsx scripts/test-mdid-lookup.ts
 */
import {
  findStaffMatchingScan,
  findStudentMatchingScan,
  isScanReadyForAutoLookup,
  preferStaffOverStudent,
  scanIdsEquivalent,
  scanMatchScore,
  scanNumericCore,
  staffMatchScore,
  staffMatchesScanId,
  studentMatchesScanId,
  transactionMatchesStudent,
} from "../src/lib/scan/scan-id"

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const kid = { id: "MD12214", barcode: "MD12214" }

assert(scanNumericCore("MD12214") === "12214", "core of MD12214")
assert(scanNumericCore("012214") === "12214", "core strips leading zeros")
assert(studentMatchesScanId(kid, "12214"), "keypad digits")
assert(studentMatchesScanId(kid, "MD12214"), "full MD ID")
assert(studentMatchesScanId(kid, "md12214"), "lowercase md")
assert(studentMatchesScanId(kid, "012214"), "leading zeros")
assert(studentMatchesScanId(kid, "MD-12214"), "hyphenated")
assert(studentMatchesScanId(kid, "*MD12214*"), "scanner wrappers")
assert(scanIdsEquivalent("12214", "MD012214"), "padding is the same lunch number")
assert(transactionMatchesStudent({ studentId: "12214" }, kid), "ledger row uses keypad form")
assert(transactionMatchesStudent({ studentId: "MD12214" }, kid), "ledger row uses stored mdId")

const other = { id: "MD99999", barcode: "MD99999" }
assert(!studentMatchesScanId(other, "12214"), "does not attach to a different student")

const roster = [
  { id: "MD99999", barcode: "MD99999" },
  { id: "MD12214", barcode: "MD12214" },
]
assert(findStudentMatchingScan(roster, "12214")?.id === "MD12214", "roster keypad lookup")
assert(findStudentMatchingScan(roster, "012214")?.id === "MD12214", "roster padded lookup")

// Blank barcode still resolves via MD / external id
const blankBarcode = { id: "12492", barcode: null as string | null }
assert(studentMatchesScanId(blankBarcode, "12492"), "blank barcode + numeric externalId")
assert(studentMatchesScanId(blankBarcode, "MD12492"), "blank barcode + MD prefix typed")
assert(findStudentMatchingScan([blankBarcode, kid], "12492")?.id === "12492", "roster blank barcode")

assert(!staffMatchesScanId({ badgeId: "ST-4401" }, "12214"), "staff badge stays off student MD ID")
assert(staffMatchesScanId({ badgeId: "ST-4401" }, "ST4401"), "staff badge still matches")
assert(staffMatchesScanId({ badgeId: "ST-4401" }, "st-4401"), "staff badge case")

// Shared digits: exact staff badge beats student MD expansion
const studentScarlett = { id: "MD12491", barcode: "MD12491" }
const staffAnabel = { badgeId: "12491" }
assert(scanMatchScore(studentScarlett, "12491") > 0, "student still matches digits")
assert(staffMatchScore(staffAnabel, "12491") === 100, "staff exact badge score")
assert(
  preferStaffOverStudent(scanMatchScore(studentScarlett, "12491"), staffMatchScore(staffAnabel, "12491")),
  "prefer exact staff badge over student MD expansion"
)
assert(
  !preferStaffOverStudent(
    scanMatchScore(studentScarlett, "MD12491"),
    staffMatchScore(staffAnabel, "MD12491")
  ),
  "prefer student when scan is the printed MD ID"
)
assert(findStaffMatchingScan([staffAnabel], "12491")?.badgeId === "12491", "staff roster exact")

assert(!isScanReadyForAutoLookup("1221"), "4-digit keypad not ready")
assert(isScanReadyForAutoLookup("12214"), "5-digit keypad ready")
assert(isScanReadyForAutoLookup("MD12214"), "full MD ready")
assert(!isScanReadyForAutoLookup("MD12"), "short MD not ready")

console.log("mdid-lookup checks passed")
