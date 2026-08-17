import {
  getSeniorGraduationYear,
  MAX_ENROLLED_GRADE,
  MIN_ENROLLED_GRADE,
  STUDENT_EMAIL_DOMAIN,
} from "@/config/academic-year"

export type GradeFromEmailStatus = "enrolled" | "graduated" | "unparseable"

export interface GradeFromEmailResult {
  status: GradeFromEmailStatus
  /** Two-digit class suffix from email when parseable (e.g. 27). */
  classSuffix: number | null
  /** Full graduation / class year (e.g. 2027). */
  graduationYear: number | null
  /** Current grade as string ("7"…"12") when enrolled. */
  grade: string | null
  /** Numeric grade when enrolled. */
  gradeNumber: number | null
  /** True when class year is already past the current senior class. */
  shouldArchive: boolean
  message?: string
}

const EMAIL_CLASS_RE = new RegExp(
  `^([a-z0-9._%+-]*?)(\\d{2})@${STUDENT_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`,
  "i"
)

/** Expand a 2-digit class suffix into a full graduation year near the current seniors. */
export function expandClassSuffix(
  suffix: number,
  seniorGraduationYear: number = getSeniorGraduationYear()
): number {
  const centuryBase = Math.floor(seniorGraduationYear / 100) * 100
  let year = centuryBase + suffix
  // Prefer the candidate closest to the senior class (handles 2099→2100 edge later).
  const alt = year - 100
  if (Math.abs(alt - seniorGraduationYear) < Math.abs(year - seniorGraduationYear)) {
    year = alt
  }
  const alt2 = year + 100
  if (Math.abs(alt2 - seniorGraduationYear) < Math.abs(year - seniorGraduationYear)) {
    year = alt2
  }
  return year
}

/**
 * Parse Madonna student email local-part trailing YY → class year → current grade.
 * Example: tuser27@weirtonmadonna.org → class of 2027 → 12th (when seniors are 2027).
 */
export function resolveGradeFromEmail(
  email: string | null | undefined,
  now: Date = new Date()
): GradeFromEmailResult {
  const normalized = email?.trim().toLowerCase() ?? ""
  if (!normalized) {
    return {
      status: "unparseable",
      classSuffix: null,
      graduationYear: null,
      grade: null,
      gradeNumber: null,
      shouldArchive: false,
      message: "Missing student email",
    }
  }

  const match = EMAIL_CLASS_RE.exec(normalized)
  if (!match) {
    return {
      status: "unparseable",
      classSuffix: null,
      graduationYear: null,
      grade: null,
      gradeNumber: null,
      shouldArchive: false,
      message: `Email does not match *@${STUDENT_EMAIL_DOMAIN} with trailing class year`,
    }
  }

  const classSuffix = Number(match[2])
  const seniorYear = getSeniorGraduationYear(now)
  const graduationYear = expandClassSuffix(classSuffix, seniorYear)
  const yearsUntilGrad = graduationYear - seniorYear

  if (yearsUntilGrad < 0) {
    return {
      status: "graduated",
      classSuffix,
      graduationYear,
      grade: null,
      gradeNumber: null,
      shouldArchive: true,
      message: `Class of ${graduationYear} has graduated (seniors are ${seniorYear})`,
    }
  }

  const gradeNumber = MAX_ENROLLED_GRADE - yearsUntilGrad
  if (gradeNumber < MIN_ENROLLED_GRADE || gradeNumber > MAX_ENROLLED_GRADE) {
    return {
      status: "unparseable",
      classSuffix,
      graduationYear,
      grade: null,
      gradeNumber: null,
      shouldArchive: false,
      message: `Class of ${graduationYear} maps outside grades ${MIN_ENROLLED_GRADE}–${MAX_ENROLLED_GRADE}`,
    }
  }

  return {
    status: "enrolled",
    classSuffix,
    graduationYear,
    grade: String(gradeNumber),
    gradeNumber,
    shouldArchive: false,
  }
}

/** Prefer email-derived grade; fall back to CSV/manual grade when unparseable. */
export function resolveImportGrade(
  email: string | null | undefined,
  csvGrade?: string | null,
  now: Date = new Date()
): { grade: string; shouldArchive: boolean; fromEmail: boolean } {
  const resolved = resolveGradeFromEmail(email, now)
  if (resolved.status === "enrolled" && resolved.grade) {
    return { grade: resolved.grade, shouldArchive: false, fromEmail: true }
  }
  if (resolved.status === "graduated") {
    return {
      grade: csvGrade?.trim() || "12",
      shouldArchive: true,
      fromEmail: true,
    }
  }
  return {
    grade: csvGrade?.trim() ?? "",
    shouldArchive: false,
    fromEmail: false,
  }
}

/** Parse "Last, First" or "First Last" directory-style names. */
export function parseStudentDisplayName(raw: string): { firstName: string; lastName: string } {
  const s = raw.trim().replace(/^"|"$/g, "")
  if (!s) return { firstName: "", lastName: "" }
  if (s.includes(",")) {
    const [last, ...rest] = s.split(",")
    return { lastName: (last ?? "").trim(), firstName: rest.join(",").trim() }
  }
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1]!,
  }
}

/**
 * Madonna local-part pattern: firstInitial + lastName + YY
 * e.g. lmorris31 → initial L, lastName morris, suffix 31
 */
export function parseMadonnaStudentLocalPart(email: string): {
  initial: string
  lastNameHint: string
  classSuffix: number
} | null {
  const normalized = email.trim().toLowerCase()
  const match = EMAIL_CLASS_RE.exec(normalized)
  if (!match) return null
  const local = match[1] ?? ""
  const classSuffix = Number(match[2])
  if (!local) return null
  return {
    initial: local[0]!,
    lastNameHint: local.slice(1),
    classSuffix,
  }
}
