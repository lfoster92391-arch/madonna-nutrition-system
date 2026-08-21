"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useQueryClient } from "@tanstack/react-query"
import { Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/lib/api/client"
import { compressImageDataUrl } from "@/lib/images/compress-data-url"
import { photoStatusLabel } from "@/lib/students/photo-moderation"
import type { PhotoModerationStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type ParentStudentPhotoUploadProps = {
  studentId: string
  studentName: string
  currentPhoto: string
  photoStatus?: PhotoModerationStatus
  /** Compact layout for dashboard student cards */
  compact?: boolean
  className?: string
}

export function ParentStudentPhotoUpload({
  studentId,
  studentName,
  currentPhoto,
  photoStatus = "none",
  compact = false,
  className,
}: ParentStudentPhotoUploadProps) {
  const queryClient = useQueryClient()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [displayPhoto, setDisplayPhoto] = useState(currentPhoto)
  const [displayStatus, setDisplayStatus] = useState(photoStatus)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setDisplayPhoto(currentPhoto)
  }, [currentPhoto])

  useEffect(() => {
    setDisplayStatus(photoStatus)
  }, [photoStatus])

  const previewSrc = pendingPhoto ?? displayPhoto
  const isDataUrl = previewSrc.startsWith("data:")

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const compressed = await compressImageDataUrl(dataUrl)
      setPendingPhoto(compressed)
      setPhotoMessage("Preview ready. Tap Save photo to submit for admin review.")
    } catch {
      setPhotoMessage("Could not read that image. Try another photo.")
    }
    e.target.value = ""
  }

  function triggerPhotoUpload(mode: "file" | "camera") {
    const ref = mode === "camera" ? cameraInputRef : photoInputRef
    ref.current?.click()
  }

  function requestSavePhoto() {
    if (!pendingPhoto) {
      setPhotoMessage("Take or upload a photo first, then tap Save photo.")
      return
    }
    setConfirmOpen(true)
  }

  async function handleSavePhoto() {
    if (!pendingPhoto) return
    setConfirmOpen(false)
    setPhotoBusy(true)
    setPhotoMessage(null)
    try {
      const compressed = await compressImageDataUrl(pendingPhoto)
      const updated = await api.uploadStudentPhoto(studentId, compressed)
      setDisplayPhoto(updated.photo)
      setDisplayStatus(updated.photoStatus ?? "pending")
      setPendingPhoto(null)
      setPhotoMessage(
        "Photo submitted for admin review. It will appear on lunch badges after approval."
      )
      void queryClient.invalidateQueries({ queryKey: ["students"] })
      void queryClient.invalidateQueries({ queryKey: ["badges"] })
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
        capture="environment"
        className="hidden"
        onChange={(e) => void handlePhotoUpload(e)}
      />

      <div
        className={cn(
          "flex gap-4",
          compact ? "flex-col sm:flex-row sm:items-start" : "flex-col items-center sm:flex-row sm:items-start"
        )}
      >
        <div className="relative shrink-0">
          <Image
            src={previewSrc}
            alt={`${studentName} photo`}
            width={compact ? 72 : 140}
            height={compact ? 72 : 140}
            unoptimized={isDataUrl}
            className={cn(
              "border-2 border-silver/60 object-cover",
              compact ? "h-[72px] w-[72px] rounded-full" : "rounded-[20px]"
            )}
          />
          {pendingPhoto && (
            <p className="mt-1 text-center text-xs font-medium text-amber-800">
              New photo — not saved yet
            </p>
          )}
        </div>

        <div className={cn("flex min-w-0 flex-1 flex-col gap-2", compact ? "" : "sm:min-w-[220px]")}>
          {!compact && (
            <p className="text-sm text-silver-foreground">
              Add a clear face photo for lunch badges and checkout. Photos are reviewed by the school
              before badges update.
            </p>
          )}
          <p className="text-xs font-medium text-primary">{photoStatusLabel(displayStatus)}</p>
          <div className={cn("flex flex-wrap gap-2", compact && "flex-col")}>
            <Button
              type="button"
              size={compact ? "default" : "lg"}
              className={cn(compact ? "min-h-11 w-full justify-start" : "min-h-14 text-base")}
              disabled={photoBusy}
              onClick={() => triggerPhotoUpload("camera")}
            >
              <Camera className="h-5 w-5" />
              Take photo
            </Button>
            <Button
              type="button"
              size={compact ? "default" : "lg"}
              variant="outline"
              className={cn(compact ? "min-h-11 w-full justify-start" : "min-h-14 text-base")}
              disabled={photoBusy}
              onClick={() => triggerPhotoUpload("file")}
            >
              <Upload className="h-5 w-5" />
              Upload photo
            </Button>
            <Button
              type="button"
              size={compact ? "default" : "lg"}
              className={cn(compact ? "min-h-11 w-full justify-start" : "min-h-14 text-base")}
              disabled={photoBusy}
              onClick={requestSavePhoto}
            >
              {photoBusy ? "Saving…" : "Save photo"}
            </Button>
          </div>
          {photoMessage && (
            <p className="text-sm text-silver-foreground" role="status">
              {photoMessage}
            </p>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Photo must be school appropriate</DialogTitle>
            <DialogDescription>
              Before we save this photo for {studentName}, please confirm it meets school guidelines.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2 pl-5 text-sm text-primary">
            <li>School appropriate (no costumes, filters, or inappropriate content)</li>
            <li>Close-up of the student’s face</li>
            <li>Shoulders and up, facing the camera</li>
            <li>School staff will verify or deny the photo before it appears on lunch badges</li>
          </ul>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSavePhoto()} disabled={photoBusy}>
              I understand — submit for review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
