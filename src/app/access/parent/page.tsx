import { AccessHubClient } from "@/components/landing/AccessHubClient"

export default function ParentAccessPage() {
  return (
    <AccessHubClient
      title="Parent Access"
      subtitle="Sign in to the Parent portal or create an account."
      accent="#0B2D8F"
      hub="parent"
      expandSingleByDefault
    />
  )
}
