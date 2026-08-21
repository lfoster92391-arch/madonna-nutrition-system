import { downloadCsv, rowsToCsvLabeled } from "@/lib/import-export/csv"
import {
  cleanExportPhotoUrl,
  excelTextId,
  photoOnFileLabel,
} from "@/lib/import-export/export-sanitize"
import { ROLE_LABELS } from "@/lib/users"
import type { Student, User } from "@/lib/types"

function studentEmailForExport(student: Student): string {
  return student.email?.trim() || student.parentContacts?.[0]?.email?.trim() || ""
}

const STUDENT_BADGE_EXPORT_COLUMNS: Array<{ key: string; label: string }> = [
  { key: "mdId", label: "MD ID" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "grade", label: "Grade" },
  { key: "email", label: "Email" },
  { key: "homeroom", label: "Homeroom" },
  { key: "badgeStatus", label: "Badge Status" },
  { key: "barcode", label: "Barcode" },
  { key: "photoUrl", label: "Photo URL" },
  { key: "photoOnFile", label: "Photo On File" },
]

const STAFF_BADGE_EXPORT_COLUMNS: Array<{ key: string; label: string }> = [
  { key: "badgeId", label: "Badge ID" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "department", label: "Department" },
  { key: "accountStatus", label: "Account Status" },
  { key: "photoUrl", label: "Photo URL" },
  { key: "photoOnFile", label: "Photo On File" },
]

function sortStudents(students: Student[]): Student[] {
  return [...students].sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" })
    if (last !== 0) return last
    return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" })
  })
}

function sortStaff(users: User[]): User[] {
  return [...users].sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" })
    if (last !== 0) return last
    return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" })
  })
}

export function buildStudentBadgeExportRows(students: Student[]): Record<string, string>[] {
  return sortStudents(students).map((s) => {
    const mdId = s.id.trim()
    const barcode = (s.barcode ?? s.id).trim()
    return {
      mdId: excelTextId(mdId),
      firstName: s.firstName.trim(),
      lastName: s.lastName.trim(),
      grade: String(s.grade ?? "").trim(),
      email: studentEmailForExport(s),
      homeroom: (s.homeroom ?? "").trim(),
      badgeStatus: (s.badgeStatus ?? "pending").toLowerCase(),
      barcode: excelTextId(barcode),
      photoUrl: cleanExportPhotoUrl(s.photo),
      photoOnFile: photoOnFileLabel(s.photo),
    }
  })
}

export function buildStaffBadgeExportRows(users: User[]): Record<string, string>[] {
  return sortStaff(users).map((u) => {
    const badgeId = (u.badgeId ?? "").trim()
    return {
      badgeId: excelTextId(badgeId),
      firstName: u.firstName.trim(),
      lastName: u.lastName.trim(),
      email: u.email.trim(),
      role: ROLE_LABELS[u.role] ?? u.role,
      department: (u.department ?? "").trim(),
      accountStatus: u.status === "disabled" ? "inactive" : (u.status ?? "active"),
      photoUrl: cleanExportPhotoUrl(u.photo),
      photoOnFile: photoOnFileLabel(u.photo),
    }
  })
}

export function downloadStudentBadgeRosterCsv(
  students: Student[],
  filename = "student-badge-roster-export.csv"
) {
  const rows = buildStudentBadgeExportRows(students)
  const content = rowsToCsvLabeled(STUDENT_BADGE_EXPORT_COLUMNS, rows)
  downloadCsv(filename, content)
}

export function downloadStaffBadgeRosterCsv(
  users: User[],
  filename = "staff-badge-roster-export.csv"
) {
  const rows = buildStaffBadgeExportRows(users)
  const content = rowsToCsvLabeled(STAFF_BADGE_EXPORT_COLUMNS, rows)
  downloadCsv(filename, content)
}
