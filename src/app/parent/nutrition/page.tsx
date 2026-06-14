"use client"

import Link from "next/link"
import { ModuleShell } from "@/components/layout/ModuleShell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ParentNutritionPage() {
  return (
    <ModuleShell section="Parent Portal" title="Nutrition" description="Review menus, allergens, and dietary guidance.">
      <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
        <p className="text-[#041B52]">Nutrition profiles are managed in the Food Safety Center.</p>
        <Button asChild className="mt-6"><Link href="/parent/student-profile">Open Food Safety Center</Link></Button>
      </Card>
    </ModuleShell>
  )
}
