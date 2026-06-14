"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { parentLinkedStudents } from "@/data/demo"
import { useAuth } from "@/components/providers/AuthProvider"
import { FamilySettingsNav } from "@/components/parent/settings/FamilySettingsNav"
import { NotificationsSection } from "@/components/parent/settings/sections/NotificationsSection"
import { PaymentSettingsSection } from "@/components/parent/settings/sections/PaymentSettingsSection"
import { PrivacySection } from "@/components/parent/settings/sections/PrivacySection"
import { ProfileSection } from "@/components/parent/settings/sections/ProfileSection"
import { SecuritySection } from "@/components/parent/settings/sections/SecuritySection"
import { StudentSettingsSection } from "@/components/parent/settings/sections/StudentSettingsSection"
import { SupportSection } from "@/components/parent/settings/sections/SupportSection"
import {
  parseFamilySettingsSection,
  type FamilySettingsSectionId,
} from "@/components/parent/settings/sections"
import { getNotificationPrefs } from "@/lib/parent-balance-alerts"

const DEMO_PAYMENT_METHOD_COUNT = 2

function firstNameFromDisplay(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName
}

function SectionContent({ section }: { section: FamilySettingsSectionId }) {
  switch (section) {
    case "profile":
      return <ProfileSection />
    case "notifications":
      return <NotificationsSection />
    case "payments":
      return <PaymentSettingsSection />
    case "students":
      return <StudentSettingsSection />
    case "privacy":
      return <PrivacySection />
    case "security":
      return <SecuritySection />
    case "support":
      return <SupportSection />
    default:
      return <ProfileSection />
  }
}

export function FamilySettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const sectionParam = searchParams.get("section")
  const [activeSection, setActiveSection] = useState<FamilySettingsSectionId>(() =>
    parseFamilySettingsSection(sectionParam)
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const hash = window.location.hash.replace("#", "")
    if (hash && !sectionParam) {
      const fromHash = parseFamilySettingsSection(hash)
      setActiveSection(fromHash)
      router.replace(`/parent/settings?section=${fromHash}`, { scroll: false })
    }
  }, [sectionParam, router])

  useEffect(() => {
    if (sectionParam) {
      setActiveSection(parseFamilySettingsSection(sectionParam))
    }
  }, [sectionParam])

  const handleSectionChange = useCallback(
    (section: FamilySettingsSectionId) => {
      setActiveSection(section)
      router.replace(`/parent/settings?section=${section}`, { scroll: false })
    },
    [router]
  )

  const parentFirstName = user?.displayName
    ? firstNameFromDisplay(user.displayName)
    : "Sarah"

  const notificationsEnabled = useMemo(() => {
    const prefs = getNotificationPrefs()
    return Object.values(prefs).some(Boolean)
  }, [activeSection])

  const headerPills = [
    { emoji: "👨‍🎓", label: `${parentLinkedStudents.length} Students` },
    {
      emoji: "🔔",
      label: notificationsEnabled ? "Notifications Enabled" : "Notifications Off",
    },
    { emoji: "💳", label: `${DEMO_PAYMENT_METHOD_COUNT} Payment Methods` },
  ]

  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Family Settings
        </p>
        <div>
          <h1 className="text-2xl font-bold text-primary md:text-3xl">
            Welcome back, {parentFirstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-silver-foreground md:text-base">
            Manage how Fuel The Dons works for your family.
          </p>
          <p className="mt-1 max-w-3xl text-sm text-silver-foreground">
            Manage your family account, notifications, payments, student preferences, and privacy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {headerPills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-silver/60 bg-white px-3 py-1.5 text-xs font-medium text-primary"
            >
              <span aria-hidden>{pill.emoji}</span>
              {pill.label}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-[14px] border border-silver/60 bg-white p-3 lg:sticky lg:top-6 lg:self-start">
          <FamilySettingsNav
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </aside>

        <div className="min-w-0">
          <SectionContent section={activeSection} />
        </div>
      </div>
    </div>
  )
}
