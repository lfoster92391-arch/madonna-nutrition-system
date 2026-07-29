import { CalendarDesignStudio } from "@/components/admin/calendar-design/CalendarDesignStudio"

export const metadata = {
  title: "Calendar Design Studio | Madonna Nutrition",
  description: "Create beautiful, engaging lunch calendars for your school community.",
}

export default function CalendarDesignPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <CalendarDesignStudio />
    </div>
  )
}
