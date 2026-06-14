export type FamilySettingsSectionId =
  | "profile"
  | "notifications"
  | "payments"
  | "students"
  | "privacy"
  | "security"
  | "support"

export const FAMILY_SETTINGS_SECTIONS: {
  id: FamilySettingsSectionId
  label: string
}[] = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "payments", label: "Payments" },
  { id: "students", label: "Students" },
  { id: "privacy", label: "Privacy" },
  { id: "security", label: "Security" },
  { id: "support", label: "Support" },
]

export const DEFAULT_FAMILY_SETTINGS_SECTION: FamilySettingsSectionId = "profile"

export function parseFamilySettingsSection(
  value: string | null | undefined
): FamilySettingsSectionId {
  if (value && FAMILY_SETTINGS_SECTIONS.some((s) => s.id === value)) {
    return value as FamilySettingsSectionId
  }
  return DEFAULT_FAMILY_SETTINGS_SECTION
}
