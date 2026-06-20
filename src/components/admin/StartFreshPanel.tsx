"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clearAllDemoCaches } from "@/lib/demo/session"

export function StartFreshPanel() {
  const [cleared, setCleared] = useState(false)

  function handleStartFresh() {
    clearAllDemoCaches()
    setCleared(true)
    window.setTimeout(() => setCleared(false), 3000)
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4" />
          Clear Local Caches
        </CardTitle>
        <CardDescription>
          Clear stale browser caches for agreements and legacy session data. Imported students and
          database records are not affected.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={handleStartFresh}>
          Clear local caches
        </Button>
        {cleared ? (
          <span className="text-sm text-emerald-700">Local caches cleared.</span>
        ) : null}
      </div>
    </Card>
  )
}
