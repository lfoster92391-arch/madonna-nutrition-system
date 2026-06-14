import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ParentSectionPageProps {
  title: string
  description: string
}

export function ParentSectionPage({ title, description }: ParentSectionPageProps) {
  return (
    <div className="p-8">
      <Card className="max-w-2xl rounded-[20px] border-silver/60 p-8">
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        <p className="mt-3 text-silver-foreground">{description}</p>
        <Button asChild className="mt-6">
          <Link href="/parent">Back to Dashboard</Link>
        </Button>
      </Card>
    </div>
  )
}
