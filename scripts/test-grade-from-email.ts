/**
 * Lightweight assertions for grade-from-email (no test runner required).
 *   npx tsx scripts/test-grade-from-email.ts
 */
import { getSeniorGraduationYear } from "../src/config/academic-year"
import { resolveGradeFromEmail } from "../src/lib/students/grade-from-email"

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const aug2026 = new Date(2026, 7, 16, 12) // Aug 16, 2026 local
assert(getSeniorGraduationYear(aug2026) === 2027, "Aug 2026 seniors should be 2027")
assert(getSeniorGraduationYear(new Date(2027, 0, 15, 12)) === 2027, "Jan 2027 seniors still 2027")
assert(getSeniorGraduationYear(new Date(2027, 6, 1, 12)) === 2028, "Jul 2027 seniors become 2028")

const tuser = resolveGradeFromEmail("tuser27@weirtonmadonna.org", aug2026)
assert(tuser.status === "enrolled" && tuser.grade === "12", "27 → 12th")

const g11 = resolveGradeFromEmail("sbabelonia28@weirtonmadonna.org", aug2026)
assert(g11.grade === "11", "28 → 11th")

const g7 = resolveGradeFromEmail("sbaily32@weirtonmadonna.org", aug2026)
assert(g7.grade === "7", "32 → 7th")

const graduated = resolveGradeFromEmail("oldgrad26@weirtonmadonna.org", aug2026)
assert(graduated.status === "graduated" && graduated.shouldArchive, "26 should archive")

const nextYear = resolveGradeFromEmail("tuser27@weirtonmadonna.org", new Date(2027, 7, 1, 12))
assert(nextYear.status === "graduated", "class of 2027 archives after Jul 2027 rollover")

const bumped = resolveGradeFromEmail("sbabelonia28@weirtonmadonna.org", new Date(2027, 7, 1, 12))
assert(bumped.grade === "12", "28 becomes 12th next year")

console.log("grade-from-email checks passed")
console.log(
  JSON.stringify(
    {
      senior2026: getSeniorGraduationYear(aug2026),
      map: {
        "27": tuser.grade,
        "28": g11.grade,
        "32": g7.grade,
      },
    },
    null,
    2
  )
)
