import { redirect } from "next/navigation"

/** Launch was removed — keep the route as a safe redirect, not Cookbook. */
export default function AdminLaunchPage() {
  redirect("/admin")
}
