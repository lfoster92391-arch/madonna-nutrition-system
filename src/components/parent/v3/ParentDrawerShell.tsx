"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ParentDrawerShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  wide?: boolean
}

export function ParentDrawerShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide = false,
}: ParentDrawerShellProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`flex max-h-full flex-col overflow-hidden p-0 ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <SheetHeader className="shrink-0 border-b border-[#C7CCD6] px-6 py-5 pr-14">
          <SheetTitle style={{ color: "#041B52" }}>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
