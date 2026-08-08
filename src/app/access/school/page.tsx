import { AccessHubClient } from "@/components/landing/AccessHubClient"
import { SCHOOL_CHOICES } from "@/components/landing/access-choices"

export default function SchoolAccessPage() {
  return (
    <AccessHubClient
      title="School Access"
      subtitle="Open the lunch scanner or sign in to a campus portal."
      accent="#0D7A3B"
      choices={SCHOOL_CHOICES}
    />
  )
}
