import type { Student } from "@/lib/types"
import type { TeacherStudentView } from "@/lib/teacher/types"
import { isLowFunds } from "@/lib/teacher/low-funds"

const TEACHER_COUNSELOR_MAP: Record<string, string> = {
  "10501": "Mrs. Patterson",
  "10502": "Mr. Collins",
  "10503": "Ms. Rivera",
  "10504": "Mrs. Patterson",
  "1003": "Mrs. Patterson",
  "1006": "Mr. Collins",
}

/** Strip balance, allergies, parent contacts, and payment history from student records. */
export function mapStudentForTeacher(student: Student): TeacherStudentView {
  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    photo: student.photo,
    grade: student.grade,
    homeroom: student.homeroom,
    counselor: TEACHER_COUNSELOR_MAP[student.id],
    lowFunds: isLowFunds(student.balance),
  }
}

/** Assert API response never leaks balance — used in tests and route handlers. */
export function assertNoBalanceLeak(payload: Record<string, unknown>): void {
  const forbidden = ["balance", "balanceAfter", "amount", "accountBalance"]
  for (const key of forbidden) {
    if (key in payload && payload[key] !== undefined) {
      throw new Error(`Teacher API privacy violation: field "${key}" must not be exposed`)
    }
  }
}
