import { redirect } from "next/navigation"

/** Legacy alias — the meal library lives at /admin/cookbook. */
export default function MenuLibraryPage() {
  redirect("/admin/cookbook")
}
