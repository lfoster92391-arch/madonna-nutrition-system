import { redirect } from "next/navigation"
import { parentLinkedStudents } from "@/data/demo"

export default function StudentProfileIndexPage() {
  const first = parentLinkedStudents[0]
  if (first) {
    redirect(`/parent/student-profile/${first.id}`)
  }
  redirect("/parent/students")
}
