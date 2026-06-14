import { forwardRef } from "react"
import { cn } from "@/lib/utils"

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-14 w-full rounded-2xl border border-silver/80 bg-white px-4 text-base text-primary outline-none transition placeholder:text-silver-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20",
          className
        )}
        {...props}
      />
    )
  }
)

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-2 block text-sm font-medium text-primary", className)}
      {...props}
    />
  )
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-14 w-full rounded-2xl border border-silver/80 bg-white px-4 text-base text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
