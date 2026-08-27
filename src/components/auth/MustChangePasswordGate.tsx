"use client"

import { useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { api } from "@/lib/api/client"

export function MustChangePasswordGate({ children }: { children: React.ReactNode }) {
  const { user, mustChangePassword, clearMustChangePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!mustChangePassword || !user?.id) {
    return <>{children}</>
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      await api.changePassword(user!.id, currentPassword, newPassword)
      clearMustChangePassword()
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
        <div className="my-auto max-h-[min(90dvh,36rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-silver/60 bg-white p-6 shadow-lg">
          <h2 className="text-lg font-bold text-primary">Change your password</h2>
          <p className="mt-2 text-sm text-silver-foreground">
            You are using a temporary password. Set a new password before continuing.
          </p>
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
