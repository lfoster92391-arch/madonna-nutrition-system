import { redirect } from "next/navigation"

/** Legacy Meal Roster URL — same list lives at Who signed up for lunch. */
export default function TeacherMealRosterPage() {
  redirect("/teacher/who-signed-up")
}
