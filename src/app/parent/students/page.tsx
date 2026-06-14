import { ParentSectionPage } from "@/components/parent/ParentSectionPage"
import { parentLinkedStudents } from "@/data/demo"
import Image from "next/image"
import { Card } from "@/components/ui/card"

export default function MyStudentsPage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-primary">My Students</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {parentLinkedStudents.map((s) => (
          <Card key={s.id} className="rounded-[20px] p-6">
            <div className="flex items-center gap-4">
              <Image src={s.photo} alt={s.firstName} width={64} height={64} className="rounded-2xl object-cover" />
              <div>
                <p className="font-bold text-primary">
                  {s.firstName} {s.lastName}
                </p>
                <p className="text-sm text-silver-foreground">Grade {s.grade}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
