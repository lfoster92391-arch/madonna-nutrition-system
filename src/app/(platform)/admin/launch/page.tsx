import { redirect } from "next/navigation"

/** Launch Controls live on the dashboard Get Started section — not the cookbook. */
export default function AdminLaunchPage() {
  redirect("/admin#get-started")
}
