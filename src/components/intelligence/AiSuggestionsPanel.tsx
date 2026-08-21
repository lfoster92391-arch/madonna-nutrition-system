"use client"

import { Sparkles } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SuggestionsData } from "@/lib/intelligence/types"
import { INTELLIGENCE_REFETCH_MS } from "@/lib/intelligence/refresh"
import { cn } from "@/lib/utils"

async function fetchSuggestions(): Promise<SuggestionsData> {
  const res = await fetch("/api/intelligence/suggestions")
  if (!res.ok) throw new Error("Failed to load suggestions")
  return res.json()
}

const priorityStyles = {
  high: "border-[#D62828]/30 bg-[#D62828]/5",
  medium: "border-amber-300/50 bg-amber-50",
  low: "border-[#AEB6C2]/60 bg-white",
}

export function AiSuggestionsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "suggestions"],
    queryFn: fetchSuggestions,
    refetchInterval: INTELLIGENCE_REFETCH_MS,
  })

  return (
    <Card className="rounded-[20px] border-[#AEB6C2]/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#041B52]" />
          <CardTitle className="text-[#041B52]">AI Assistant</CardTitle>
        </div>
        <CardDescription>
          Rule-based suggestions from meals, inventory, and calendar data — not operational commands.
        </CardDescription>
      </CardHeader>
      <div className="space-y-3 px-6 pb-6">
        {isLoading && <p className="text-sm text-[#AEB6C2]">Analyzing operations…</p>}
        {data?.suggestions.map((s) => (
          <div
            key={s.id}
            className={cn("rounded-2xl border p-4", priorityStyles[s.priority])}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[#041B52]">{s.title}</p>
              <Badge variant="outline" className="text-[10px] uppercase">
                {s.category}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-[#041B52]/80">{s.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
