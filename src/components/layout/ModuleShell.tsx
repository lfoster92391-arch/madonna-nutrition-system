import { cn } from "@/lib/utils"

interface ModuleShellProps {
  title: string
  description?: string
  section?: string
  children?: React.ReactNode
  className?: string
}

export function ModuleShell({ title, description, section, children, className }: ModuleShellProps) {
  return (
    <div className={cn("min-h-screen bg-white p-8", className)}>
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          {section ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#041B52]">{section}</p>
          ) : null}
          <h1 className="text-3xl font-bold text-[#041B52]">{title}</h1>
          {description ? <p className="mt-1 text-[#AEB6C2]">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  )
}
