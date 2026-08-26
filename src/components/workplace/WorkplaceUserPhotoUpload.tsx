"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Camera, Upload, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { compressImageDataUrl } from "@/lib/images/compress-data-url"
import { cn } from "@/lib/utils"

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type WorkplaceUserPhotoUploadProps = {
  userId: string
  displayName: string
  currentPhoto?: string | null
  onSaved?: (photo: string) => void
  accentColor?: string
  className?: string
}

/**
 * Staff/teacher self-serve badge photo. Saves to User.photo (no student-style
 * moderation queue) so printed staff badges update after Save.
 */
export function WorkplaceUserPhotoUpload({
  userId,
  displayName,
  currentPhoto,
  onSaved,
  accentColor = "#0A1E3F",
  className,
}: WorkplaceUserPhotoUploadProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [displayPhoto, setDisplayPhoto] = useState(currentPhoto?.trim() || "")
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)

  useEffect(() => {
    setDisplayPhoto(currentPhoto?.trim() || "")
  }, [currentPhoto])

  const previewSrc = pendingPhoto ?? displayPhoto
  const isDataUrl = previewSrc.startsWith("data:")

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const compressed = await compressImageDataUrl(dataUrl)
      setPendingPhoto(compressed)
      setPhotoMessage("Preview ready. Tap Save photo — it will show on your printed badge.")
    } catch {
      setPhotoMessage("Could not read that image. Try another photo.")
    }
    e.target.value = ""
  }

  function triggerPhotoUpload(mode: "file" | "camera") {
    const ref = mode === "camera" ? cameraInputRef : photoInputRef
    ref.current?.click()
  }

  async function handleSavePhoto() {
    if (!pendingPhoto) {
      setPhotoMessage("Take or upload a photo first, then tap Save photo.")
      return
    }
    setPhotoBusy(true)
    setPhotoMessage(null)
    try {
      const compressed = await compressImageDataUrl(pendingPhoto)
      const updated = await api.uploadUserPhoto(userId, compressed)
      const next = updated.photo?.trim() || compressed
      setDisplayPhoto(next)
      setPendingPhoto(null)
      setPhotoMessage("Photo saved for badges")
      onSaved?.(next)
    } catch (error) {
      setPhotoMessage(
        error instanceof Error ? error.message : "Could not save the photo. Try again."
      )
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handlePhotoUpload(e)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => void handlePhotoUpload(e)}
      />

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt={`${displayName} photo`}
              width={140}
              height={140}
              unoptimized={isDataUrl}
              className="h-[140px] w-[140px] rounded-[20px] border-2 border-silver/60 object-cover"
            />
          ) : (
            <div
              className="flex h-[140px] w-[140px] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-silver/60 bg-silver/10"
              style={{ color: accentColor }}
            >
              <User className="h-10 w-10 opacity-40" aria-hidden />
              <span className="text-xs font-medium text-silver-foreground">No photo yet</span>
            </div>
          )}
          {pendingPhoto ? (
            <p className="mt-1 text-center text-xs font-medium text-amber-800">
              New photo — not saved yet
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:min-w-[220px]">
          <p className="text-sm text-silver-foreground">
            Add a clear face photo for your lunch badge. Take a photo or upload one, then tap Save
            photo — it appears on printed badges right away.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="lg"
              className="min-h-14 text-base"
              disabled={photoBusy}
              onClick={() => triggerPhotoUpload("camera")}
            >
              <Camera className="h-5 w-5" />
              Take photo
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-14 text-base"
              disabled={photoBusy}
              onClick={() => triggerPhotoUpload("file")}
            >
              <Upload className="h-5 w-5" />
              Upload photo
            </Button>
            <Button
              type="button"
              size="lg"
              className="min-h-14 text-base"
              disabled={photoBusy}
              onClick={() => void handleSavePhoto()}
            >
              {photoBusy ? "Saving…" : "Save photo"}
            </Button>
          </div>
          {photoMessage ? (
            <p
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium",
                photoMessage === "Photo saved for badges"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "bg-silver/20 text-primary"
              )}
              role="status"
            >
              {photoMessage}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
