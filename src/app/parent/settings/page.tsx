import { Suspense } from "react"
import { redirect } from "next/navigation"
import { FamilySettingsPage } from "@/components/parent/settings/FamilySettingsPage"

type SettingsPageProps = {
  searchParams: Promise<{ section?: string }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const { section } = await searchParams
  if (!section) {
    redirect("/parent?drawer=settings")
  }

  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <FamilySettingsPage />
    </Suspense>
  )
}
