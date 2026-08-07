import { redirect } from "next/navigation"

/** Legacy path: Menu is the lunch calendar, not the cookbook. */
export default function AdminMenuPage() {
  redirect("/admin/calendar")
}
