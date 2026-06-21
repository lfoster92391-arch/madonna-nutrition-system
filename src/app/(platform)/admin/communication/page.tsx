"use client"

import { useCallback, useEffect, useState } from "react"
import { Megaphone, Send } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"

interface AnnouncementRow {
  id: string
  title: string
  body: string
  audience?: string
  date?: string
}

export default function AdminCommunicationPage() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState<"ALL" | "PARENTS" | "TEACHERS">("ALL")
  const [sendEmail, setSendEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const loadAnnouncements = useCallback(async () => {
    if (!databaseEnabled) {
      setAnnouncements([])
      return
    }
    const res = await fetch("/api/announcements")
    if (res.ok) {
      const data = await res.json()
      setAnnouncements(data.announcements ?? [])
    }
  }, [databaseEnabled])

  useEffect(() => {
    void loadAnnouncements()
  }, [loadAnnouncements])

  async function handlePublish() {
    if (!user || !title.trim() || !body.trim()) return
    if (!databaseEnabled) {
      setToast("Database is required to publish announcements.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-user-id": user.id,
        },
        body: JSON.stringify({
          adminUserId: user.id,
          title: title.trim(),
          body: body.trim(),
          audience,
          sendEmail,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        emailsSent?: number
        emailsFailed?: number
      }
      if (!res.ok) {
        setToast("Unable to publish announcement.")
        return
      }
      setTitle("")
      setBody("")
      setToast(
        sendEmail
          ? `Announcement published. ${data.emailsSent ?? 0} email(s) sent${
              data.emailsFailed ? `, ${data.emailsFailed} failed` : ""
            }.`
          : "Announcement published (in-app only)."
      )
      await loadAnnouncements()
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-primary">
            <Megaphone className="h-8 w-8" />
            Communications
          </h1>
          <p className="text-silver-foreground">
            Broadcast menu changes and notices to parents and teachers.
          </p>
        </div>

        {toast ? (
          <div className="rounded-2xl border border-success/40 bg-success/10 px-6 py-4 font-medium text-success">
            {toast}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>New Announcement</CardTitle>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            <div>
              <Label>Audience</Label>
              <select
                className="mt-1 w-full rounded-xl border border-silver/60 px-3 py-2 text-sm"
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
              >
                <option value="ALL">Parents &amp; Teachers</option>
                <option value="PARENTS">Parents only</option>
                <option value="TEACHERS">Teachers only</option>
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                className="mt-1 min-h-28 w-full rounded-xl border border-silver/60 px-3 py-2 text-sm"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-primary">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-silver/60"
              />
              Also send branded email to selected audience
            </label>
            <Button type="button" disabled={saving || !databaseEnabled} onClick={() => void handlePublish()}>
              <Send className="mr-2 h-4 w-4" />
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Published ({announcements.length})</CardTitle>
          </CardHeader>
          {announcements.length === 0 ? (
            <p className="px-6 pb-6 text-silver-foreground">
              No announcements yet. Publish your first notice above.
            </p>
          ) : (
            <ul className="divide-y divide-silver/30 px-6 pb-6">
              {announcements.map((ann) => (
                <li key={ann.id} className="py-4">
                  <p className="font-semibold text-primary">{ann.title}</p>
                  <p className="mt-1 text-sm text-silver-foreground">{ann.body}</p>
                  <p className="mt-2 text-xs text-silver-foreground">
                    {ann.audience ?? "ALL"} · {ann.date ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
