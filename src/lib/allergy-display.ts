import type { Allergy } from "@/lib/types"

export function getAllergyBannerStyle(severity: Allergy["severity"]) {
  switch (severity) {
    case "severe":
      return { bg: "bg-danger/10 border-danger", text: "text-danger", label: "SEVERE ALLERGY" }
    case "moderate":
      return { bg: "bg-warning/10 border-warning", text: "text-warning", label: "MODERATE ALLERGY" }
    case "informational":
      return { bg: "bg-primary/10 border-primary", text: "text-primary", label: "DIETARY NOTE" }
  }
}

export function getHighestAllergySeverity(allergies: Allergy[]): Allergy["severity"] | null {
  if (allergies.length === 0) return null
  if (allergies.some((a) => a.severity === "severe")) return "severe"
  if (allergies.some((a) => a.severity === "moderate")) return "moderate"
  return "informational"
}
