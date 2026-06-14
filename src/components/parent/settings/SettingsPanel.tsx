import { cn } from "@/lib/utils"

export function SettingsPanel({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-[14px] border border-silver/60 bg-white p-6", className)}>
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      {description && <p className="mt-2 text-sm text-silver-foreground">{description}</p>}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  )
}

export function SettingsAccordion({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[14px] border border-silver/60 bg-white [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-semibold text-primary">{title}</p>
          {description && <p className="mt-0.5 text-xs text-silver-foreground">{description}</p>}
        </div>
        <span className="text-xs font-medium text-silver-foreground group-open:hidden">Show</span>
        <span className="hidden text-xs font-medium text-silver-foreground group-open:inline">
          Hide
        </span>
      </summary>
      <div className="border-t border-silver/40 px-4 pb-4 pt-4">{children}</div>
    </details>
  )
}
