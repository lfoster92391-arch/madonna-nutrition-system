"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { cn } from "@/lib/utils"

type ParentBackLinkProps = {
  href?: string
  label?: string
  className?: string
}

export function ParentBackLink({
  href = "/parent/students",
  label = "Back to Students",
  className,
}: ParentBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 text-sm font-medium transition hover:opacity-80",
        className
      )}
      style={{ color: PARENT_NAVY }}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  )
}
