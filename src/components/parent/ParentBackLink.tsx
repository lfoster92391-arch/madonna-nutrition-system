import Link from "next/link"
import { cn } from "@/lib/utils"

type ParentBackLinkProps = {
  className?: string
  label?: string
}

/** Parent portal navigation — returns to the family dashboard. */
export function ParentBackLink({
  className,
  label = "Back to Dashboard",
}: ParentBackLinkProps) {
  return (
    <Link
      href="/parent"
      className={cn(
        "inline-flex items-center text-sm font-medium text-[#1E3A5F] underline-offset-4 hover:underline",
        className,
      )}
    >
      {label}
    </Link>
  )
}
