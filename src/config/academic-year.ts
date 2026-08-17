/**
 * Single source of truth for the current Madonna academic year.
 *
 * Student school emails encode graduation class as a trailing 2-digit year on the
 * local-part (e.g. tuser27@weirtonmadonna.org → class of 2027).
 *
 * Academic year labeling uses the spring graduation year of current seniors:
 *   AY 2026–27 → seniorGraduationYear 2027 → suffix 27 = 12th grade
 *
 * Auto-detect: Jul–Dec → seniors graduate next calendar year;
 *              Jan–Jun → seniors graduate this calendar year.
 * Override anytime with ACADEMIC_SENIOR_GRAD_YEAR=2027 (full 4-digit year).
 */

export const STUDENT_EMAIL_DOMAIN = "weirtonmadonna.org"

/** Month (1–12) when the new academic year starts for auto-detection. */
export const ACADEMIC_YEAR_ROLLOVER_MONTH = 7 // July

/** Lowest / highest grades served by Fuel The Dons (Madonna 7–12). */
export const MIN_ENROLLED_GRADE = 7
export const MAX_ENROLLED_GRADE = 12

/**
 * Full 4-digit graduation year of the current senior class.
 * Prefer env override; otherwise derive from the clock + July rollover.
 */
export function getSeniorGraduationYear(now: Date = new Date()): number {
  const env = process.env.ACADEMIC_SENIOR_GRAD_YEAR?.trim()
  if (env && /^\d{4}$/.test(env)) {
    return Number(env)
  }

  const calendarYear = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= ACADEMIC_YEAR_ROLLOVER_MONTH ? calendarYear + 1 : calendarYear
}

/** Human label like "2026–27" for the academic year containing `now`. */
export function getAcademicYearLabel(now: Date = new Date()): string {
  const senior = getSeniorGraduationYear(now)
  return `${senior - 1}–${String(senior).slice(-2)}`
}
