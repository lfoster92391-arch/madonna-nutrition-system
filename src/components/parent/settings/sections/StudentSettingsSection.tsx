"use client"

import Image from "next/image"
import Link from "next/link"
import { parentLinkedStudents } from "@/data/demo"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"
import { getStudentThreshold } from "@/lib/parent-balance-alerts"
import { formatCurrency } from "@/lib/utils"

export function StudentSettingsSection() {
  return (
    <SettingsPanel
      title="Student Settings"
      description="Quick access to lunch restrictions, funding defaults, and food preferences."
    >
      <div className="space-y-6">
        {parentLinkedStudents.map((student) => {
          const restrictions = [
            ...student.allergies.map((a) => a.name),
            ...student.dietaryRestrictions,
          ]
          const threshold = getStudentThreshold(student.id)
          const profileHref = `/parent/student-profile/${student.id}`

          return (
            <article
              key={student.id}
              className="rounded-[14px] border border-silver/60 bg-silver/5 p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Image
                  src={student.photo}
                  alt={`${student.firstName} ${student.lastName}`}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-[14px] object-cover"
                />
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-primary">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-silver-foreground">
                      Grade {student.grade} ┬╖ {student.homeroom}
                    </p>
                  </div>

                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">
                        Lunch restrictions
                      </dt>
                      <dd className="mt-1 text-primary">
                        {restrictions.length > 0 ? restrictions.join(", ") : "None listed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">
                        Notification prefs
                      </dt>
                      <dd className="mt-1 text-primary">Family defaults</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">
                        Default funding
                      </dt>
                      <dd className="mt-1 text-primary">
                        Alert below {formatCurrency(threshold)} ┬╖ Balance{" "}
                        {formatCurrency(student.balance)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">
                        Food preferences
                      </dt>
                      <dd className="mt-1 text-primary">
                        {student.dietaryRestrictions.length > 0
                          ? student.dietaryRestrictions.join(", ")
                          : "Standard menu"}
                      </dd>
                    </div>
                  </dl>

                  <Button asChild variant="outline" size="sm">
                    <Link href={profileHref}>Open Profile</Link>
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </SettingsPanel>
  )
}
