/** Seed/demo student MD IDs — excluded from badge roster and default admin student lists. */
export const DEMO_STUDENT_EXTERNAL_IDS = [
  "10457", // James Anderson
  "10458", // Emma Anderson
  "10459", // Michael Anderson
  "1001", // Sophia Martinez
  "1002", // Ethan Walker
  "1003", // Ava Johnson
] as const

const DEMO_STUDENT_ID_SET = new Set<string>(DEMO_STUDENT_EXTERNAL_IDS)

export function isDemoStudentExternalId(externalId: string): boolean {
  return DEMO_STUDENT_ID_SET.has(externalId.trim())
}
