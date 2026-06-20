"use client"

import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { DataSource } from "@/lib/intelligence/types"

interface IntelligenceShellProps {
  section: string
  title: string
  description: string
  icon: LucideIcon
  source?: DataSource
  actions?: React.ReactNode
  children: React.ReactNode
}

export function IntelligenceShell({
  section,
  title,
  description,
  icon: Icon,
  source,
  actions,
  children,
}: IntelligenceShellProps) {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#041B52]">{section}</p>
            <div className="mt-1 flex items-center gap-3">
              <Icon className="h-8 w-8 text-[#041B52]" />
              <h1 className="text-3xl font-bold text-[#041B52]">{title}</h1>
            </div>
            <p className="mt-2 text-[#AEB6C2]">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Read-only
            </Badge>
            {source && source !== "demo" && (
              <Badge variant="default" className="text-xs uppercase">
                Live data
              </Badge>
            )}
            {actions}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
