import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface AdminModuleStat {
  label: string
  value: string
  hint?: string
  variant?: "default" | "success" | "warning" | "danger"
}

interface AdminModulePageProps {
  section: string
  title: string
  description: string
  icon: LucideIcon
  stats?: AdminModuleStat[]
  children?: React.ReactNode
  readOnly?: boolean
  headerActions?: React.ReactNode
}

export function AdminModulePage({
  section,
  title,
  description,
  icon: Icon,
  stats = [],
  children,
  readOnly = false,
  headerActions,
}: AdminModulePageProps) {
  return (
    <div className="w-full px-6 py-8 md:px-8">
      <div className="mx-auto max-w-full space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{section}</p>
            <div className="mt-1 flex items-center gap-3">
              <Icon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">{title}</h1>
            </div>
            <p className="mt-2 text-silver-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {headerActions}
            {readOnly && (
              <Badge variant="outline" className="text-sm">
                Read-only
              </Badge>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  {stat.hint && (
                    <p
                      className={cn(
                        "text-sm",
                        stat.variant === "warning" && "text-warning",
                        stat.variant === "danger" && "text-danger",
                        stat.variant === "success" && "text-success",
                        !stat.variant && "text-silver-foreground"
                      )}
                    >
                      {stat.hint}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
