"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { USER_AUDIT_ACTIONS, type AuditLogEntry } from "@/lib/types"

function formatAuditValue(value: AuditLogEntry["previousValue"]): string {
  if (value == null) return "—"
  if (typeof value === "string") return value
  return JSON.stringify(value, null, 0)
}

function actionBadgeVariant(action: string): "default" | "success" | "warning" | "danger" {
  if (action === "USER_CREATED" || action === "USER_ENABLED") return "success"
  if (action === "USER_DISABLED" || action === "USER_DELETED") return "danger"
  if (action === "PASSWORD_RESET") return "warning"
  return "default"
}

interface AuditLogTableProps {
  filterUserActions?: boolean
  showHeader?: boolean
}

export function AuditLogTable({
  filterUserActions = true,
  showHeader = true,
}: AuditLogTableProps) {
  const { auditLogs, users } = useDemo()
  const [search, setSearch] = useState("")

  const rows = useMemo(() => {
    let logs = auditLogs
    if (filterUserActions) {
      logs = logs.filter((l) => USER_AUDIT_ACTIONS.includes(l.action as (typeof USER_AUDIT_ACTIONS)[number]))
    }
    if (!search.trim()) return logs
    const q = search.toLowerCase()
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.performedBy?.toLowerCase().includes(q) ||
        l.entityId?.toLowerCase().includes(q) ||
        l.reason?.toLowerCase().includes(q)
    )
  }, [auditLogs, filterUserActions, search])

  function resolveUserName(entityId?: string) {
    if (!entityId) return "—"
    const user = users.find((u) => u.id === entityId)
    return user ? `${user.firstName} ${user.lastName}` : entityId
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Audit Log</h1>
            <p className="text-silver-foreground">
              Immutable record of user management actions across the platform.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="text-sm font-medium text-primary hover:underline"
          >
            &larr; Back to User Management
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {filterUserActions ? "User Management Actions" : "All Actions"} ({rows.length})
          </CardTitle>
        </CardHeader>
        <div className="relative mb-4 px-6">
          <Search className="absolute left-10 top-1/2 h-5 w-5 -translate-y-1/2 text-silver-foreground" />
          <Input
            className="pl-12"
            placeholder="Search by action, performer, user, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-silver-foreground">No audit entries found.</p>
        ) : (
          <div className="overflow-x-auto px-6 pb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/60 text-silver-foreground">
                  <th className="pb-3 pr-4 text-left font-medium">Timestamp</th>
                  <th className="pb-3 pr-4 text-left font-medium">Action</th>
                  <th className="pb-3 pr-4 text-left font-medium">User</th>
                  <th className="pb-3 pr-4 text-left font-medium">Performed By</th>
                  <th className="pb-3 pr-4 text-left font-medium">Previous</th>
                  <th className="pb-3 pr-4 text-left font-medium">New</th>
                  <th className="pb-3 text-left font-medium">Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((log) => (
                  <tr key={log.id} className="border-b border-silver/30">
                    <td className="py-4 pr-4 whitespace-nowrap text-silver-foreground">
                      {new Date(log.performedAt ?? log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant={actionBadgeVariant(log.action)}>
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-4 pr-4 font-medium text-primary">
                      {resolveUserName(log.entityId)}
                    </td>
                    <td className="py-4 pr-4">
                      {log.performedBy ??
                        (typeof log.metadata?.reviewedBy === "string"
                          ? log.metadata.reviewedBy
                          : "—")}
                    </td>
                    <td className="py-4 pr-4 max-w-[160px] truncate text-silver-foreground">
                      {formatAuditValue(log.previousValue)}
                    </td>
                    <td className="py-4 pr-4 max-w-[160px] truncate">
                      {formatAuditValue(log.newValue)}
                    </td>
                    <td className="py-4 max-w-[200px] truncate text-silver-foreground">
                      {log.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
