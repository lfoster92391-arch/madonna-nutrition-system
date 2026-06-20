"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clearAllDemoCaches } from "@/lib/demo/session"

export function StartFreshPanel() {
  const { deactivateDemoPreview, databaseEnabled } = useDemo()
  const [cleared, setCleared] = useState(false)

  function handleStartFresh() {
    clearAllDemoCaches()
    deactivateDemoPreview()
    setCleared(true)
    window.setTimeout(() => setCleared(false), 3000)
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          Start Fresh
        </CardTitle>
        <CardDescription>
          Clear demonstration caches and exit demo preview mode. Imported students and database
          records are not affected.
          {databaseEnabled ? " Live data comes from your database." : ""}
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={handleStartFresh}>
          Clear demo caches
        </Button>
        {cleared ? (
          <span className="text-sm text-emerald-700">Demo caches cleared.</span>
        ) : null}
      </div>
    </Card>
  )
}
