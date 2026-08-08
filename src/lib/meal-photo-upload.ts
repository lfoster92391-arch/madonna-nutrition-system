import { compressImageDataUrl } from "@/lib/images/compress-data-url"

const MAX_BYTES = 8 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Could not read that image file"))
    reader.readAsDataURL(file)
  })
}

/**
 * Turn a picked/captured image into a durable URL for MealPhoto.url.
 *
 * Prefers a compressed data URL stored in Postgres (same pattern as student
 * badge photos). Filesystem `/uploads/meals/...` paths 404 after ephemeral
 * deploys, and blob: URLs die on reload — never use those for persistence.
 */
export async function uploadMealPhoto(file: File): Promise<string> {
  if (!file || file.size <= 0) {
    throw new Error("No image selected")
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 8 MB or smaller")
  }

  // Phone cameras often omit MIME or use HEIC; still try to decode via the browser.
  if (file.type && !file.type.startsWith("image/") && file.type !== "application/octet-stream") {
    throw new Error("Please choose a photo (JPEG, PNG, WebP, or GIF)")
  }

  const raw = await readFileAsDataUrl(file)
  if (!raw.startsWith("data:image/") && !raw.startsWith("data:application/octet-stream")) {
    throw new Error("Could not read that file as an image")
  }

  // Normalize odd MIME from some cameras so <img> and Postgres store a real image.
  const asImage =
    raw.startsWith("data:image/")
      ? raw
      : `data:image/jpeg;base64,${raw.split(",")[1] ?? ""}`

  const compressed = await compressImageDataUrl(asImage, { maxEdge: 1280, quality: 0.85 })
  if (!compressed.startsWith("data:image/")) {
    throw new Error("Could not process that photo — try another image")
  }

  return compressed
}
