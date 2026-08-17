"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useQueryClient } from "@tanstack/react-query"
import { Camera, Upload } from "lucide-react"
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

type ParentStudentPhotoUploadProps = {
  studentId: string
  studentName: string
  currentPhoto: string
  /** Compact layout for dashboard student cards */
  compact?: boolean
  className?: string
}

export function ParentStudentPhotoUpload({
  studentId,
  studentName,
  currentPhoto,
  compact = false,
  className,
}: ParentStudentPhotoUploadProps) {
  const queryClient = useQueryClient()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [displayPhoto, setDisplayPhoto] = useState(currentPhoto)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)

  useEffect(() => {
    setDisplayPhoto(currentPhoto)
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
      setPhotoMessage("Preview ready. Tap Save photo to use this for lunch badges.")
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
      const updated = await api.uploadStudentPhoto(studentId, compressed)
      setDisplayPhoto(updated.photo)
      setPendingPhoto(null)
      setPhotoMessage("Photo saved for lunch badges")
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
              Add a clear face photo for lunch badges and checkout.
            </p>
          )}
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
              onClick={() => void handleSavePhoto()}
            >
              {photoBusy ? "Saving…" : "Save photo"}
            </Button>
          </div>
        </div>
      </div>

      {photoMessage && (
        <p
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-medium",
            photoMessage === "Photo saved for lunch badges"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "bg-silver/20 text-primary"
          )}
          role="status"
        >
          {photoMessage}
        </p>
      )}
    </div>
  )
}
