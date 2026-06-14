"use client"

import { Clock } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface AuditTimelineEntry {
  id: string
  action: string
  entity: string
  performedAt: string
  performedBy?: string
}

export function AuditTimeline({ entries = [] }: { entries?: AuditTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-[#AEB6C2]" />
        <p className="mt-3 font-medium text-[#041B52]">Audit timeline</p>
        <p className="mt-1 text-sm text-[#AEB6C2]">System events will appear here as actions are recorded.</p>
      </Card>
    )
  }
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="rounded-[20px] border-[#AEB6C2]/60 px-5 py-4">
          <p className="font-semibold text-[#041B52]">{entry.action}</p>
          <p className="text-sm text-[#AEB6C2]">{entry.entity}</p>
        </Card>
      ))}
    </div>
  )
}
