async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  getConfig: () =>
    fetchJson<{ databaseEnabled: boolean; stripeConfigured: boolean }>("/api/config"),
  getStudents: () => fetchJson<import("@/lib/types").Student[]>("/api/students"),
  createStudent: (student: import("@/lib/types").Student) =>
    fetchJson<import("@/lib/types").Student>("/api/students", {
      method: "POST",
      body: JSON.stringify(student),
    }),
  updateStudent: (id: string, updates: Partial<import("@/lib/types").Student>) =>
    fetchJson<import("@/lib/types").Student>(`/api/students/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  disableStudent: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/students/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  getTransactions: () => fetchJson<import("@/lib/types").Transaction[]>("/api/transactions"),
  processMeal: (studentId: string, meal: string, amount: number, processedByUserId?: string) =>
    fetchJson<import("@/lib/types").Transaction>("/api/transactions/meal", {
      method: "POST",
      body: JSON.stringify({ studentId, meal, amount, processedByUserId }),
    }),
  syncBatch: (
    transactions: Array<{
      clientTxId: string
      studentId: string
      mealType: string
      amount: number
      timestamp: string
      processedByName: string
      deviceId?: string
    }>
  ) =>
    fetchJson<{
      synced: number
      skipped: number
      failedIds?: string[]
      balances?: Record<string, number>
    }>(
      "/api/transactions/sync-batch",
      {
        method: "POST",
        body: JSON.stringify({ transactions }),
      }
    ),
  getUsers: () => fetchJson<import("@/lib/types").User[]>("/api/users"),
  createUser: (input: Record<string, unknown>) =>
    fetchJson<import("@/lib/types").User>("/api/users", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateUser: (id: string, updates: Record<string, unknown>) =>
    fetchJson<import("@/lib/types").User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  disableUser: (id: string, performedBy: string, reason: string) =>
    fetchJson<{ success: boolean }>(`/api/users/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "disable", performedBy, reason }),
    }),
  enableUser: (id: string, performedBy: string, reason?: string) =>
    fetchJson<{ success: boolean }>(`/api/users/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "enable", performedBy, reason }),
    }),
  resetUserPassword: (id: string, performedBy: string) =>
    fetchJson<{ tempPassword: string }>(`/api/users/${id}`, {
      method: "POST",
      body: JSON.stringify({ action: "reset-password", performedBy }),
    }),
  deleteUser: (id: string, performedBy: string, reason: string) =>
    fetchJson<{ success: boolean }>(`/api/users/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ performedBy, reason }),
    }),
  recordUserLogin: (userId: string) =>
    fetchJson<{ success: boolean }>("/api/auth/record-login", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  getAuditLogs: () => fetchJson<import("@/lib/types").AuditLogEntry[]>("/api/audit-logs"),
  getCalendarEvents: () => fetchJson<import("@/lib/types").CalendarEvent[]>("/api/calendar/events"),
  createCalendarEvent: (event: Omit<import("@/lib/types").CalendarEvent, "id">) =>
    fetchJson<import("@/lib/types").CalendarEvent>("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify(event),
    }),
  updateCalendarEvent: (id: string, updates: Partial<import("@/lib/types").CalendarEvent>) =>
    fetchJson<import("@/lib/types").CalendarEvent>(`/api/calendar/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deleteCalendarEvent: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/calendar/events/${id}`, { method: "DELETE" }),
  getCalendarSettings: () => fetchJson<import("@/lib/types").CalendarSettings>("/api/calendar/settings"),
  updateCalendarSettings: (updates: Partial<import("@/lib/types").CalendarSettings>) =>
    fetchJson<import("@/lib/types").CalendarSettings>("/api/calendar/settings", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  getMealTemplates: () => fetchJson<import("@/lib/types").MealTemplate[]>("/api/meal-templates"),
  createMealTemplate: (template: Omit<import("@/lib/types").MealTemplate, "id" | "createdAt" | "updatedAt">) =>
    fetchJson<import("@/lib/types").MealTemplate>("/api/meal-templates", {
      method: "POST",
      body: JSON.stringify(template),
    }),
  updateMealTemplate: (id: string, updates: Partial<import("@/lib/types").MealTemplate>) =>
    fetchJson<import("@/lib/types").MealTemplate>(`/api/meal-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  duplicateMealTemplate: (id: string) =>
    fetchJson<import("@/lib/types").MealTemplate>(`/api/meal-templates/${id}/duplicate`, {
      method: "POST",
    }),
  archiveMealTemplate: (id: string) =>
    fetchJson<import("@/lib/types").MealTemplate>(`/api/meal-templates/${id}/archive`, {
      method: "POST",
    }),
  getAllergySubmissions: () =>
    fetchJson<import("@/lib/types").AllergySubmission[]>("/api/allergy-submissions"),
  submitAllergyForm: (
    studentId: string,
    submittedBy: string,
    payload: import("@/lib/types").FoodSafetyFormPayload
  ) =>
    fetchJson<import("@/lib/types").AllergySubmission>("/api/allergy-submissions", {
      method: "POST",
      body: JSON.stringify({ studentId, submittedBy, payload }),
    }),
  reviewAllergySubmission: (
    submissionId: string,
    action: "approve" | "reject" | "clarification",
    reviewedBy: string,
    reviewNote?: string
  ) =>
    fetchJson<import("@/lib/types").AllergySubmission>(
      `/api/allergy-submissions/${submissionId}/review`,
      {
        method: "POST",
        body: JSON.stringify({ action, reviewedBy, reviewNote }),
      }
    ),
  getStudentProfiles: () => fetchJson<import("@/lib/types").StudentProfile[]>("/api/student-profiles"),
  getMedicalDocuments: () => fetchJson<import("@/lib/types").MedicalDocument[]>("/api/medical-documents"),
  uploadMedicalDocument: (
    studentId: string,
    fileName: string,
    documentUrl: string,
    uploadedBy: string
  ) =>
    fetchJson<import("@/lib/types").MedicalDocument>("/api/medical-documents", {
      method: "POST",
      body: JSON.stringify({ studentId, fileName, documentUrl, uploadedBy }),
    }),
  updateParentContact: (
    studentId: string,
    contact: { name: string; email: string; phone: string }
  ) =>
    fetchJson<{ success: boolean }>("/api/medical-documents", {
      method: "PATCH",
      body: JSON.stringify({ studentId, contact }),
    }),
  createCheckoutSession: (
    studentId: string,
    parentUserId: string,
    amountDollars: number,
    savePaymentMethod = false
  ) =>
    fetchJson<{ url: string; sessionId: string }>("/api/stripe/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ studentId, parentUserId, amountDollars, savePaymentMethod }),
    }),
}
