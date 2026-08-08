import { AccessHubClient } from "@/components/landing/AccessHubClient"
import { PARENT_CHOICES } from "@/components/landing/access-choices"

export default function ParentAccessPage() {
  return (
    <AccessHubClient
      title="Parent Access"
      subtitle="Sign in to the Parent portal or create an account."
      accent="#0B2D8F"
      choices={PARENT_CHOICES}
      expandSingleByDefault
    />
  )
}
