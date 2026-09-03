import { redirect } from "next/navigation"

/** Student how-to guide removed — send visitors home. */
export default function StudentGuidePage() {
  redirect("/student")
}
