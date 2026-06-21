/** Seed/demo student MD IDs — excluded from badge roster and default admin student lists. */
export const DEMO_STUDENT_EXTERNAL_IDS = [
  "99999", // Test Testy (manual mock)
  "9999", // Short mock MD ID
  "10457", // James Anderson (seed)
  "10458", // Emma Anderson (seed)
  "10459", // Michael Anderson (seed)
  "1001", // Sophia Martinez (seed)
  "1002", // Ethan Walker (seed)
  "1003", // Ava Johnson (seed)
] as const

const DEMO_STUDENT_ID_SET = new Set<string>(DEMO_STUDENT_EXTERNAL_IDS)

export function isDemoStudentExternalId(externalId: string): boolean {
  return DEMO_STUDENT_ID_SET.has(externalId.trim())
}