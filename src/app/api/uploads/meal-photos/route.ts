import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { badRequest, serverError } from "@/lib/api/response"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return badRequest("Missing image file")
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return badRequest("Unsupported image type. Use JPEG, PNG, WebP, or GIF.")
    }

    if (file.size > MAX_BYTES) {
      return badRequest("Image must be 5 MB or smaller")
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg"
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`
    const uploadDir = path.join(process.cwd(), "public", "uploads", "meals")

    await mkdir(uploadDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, filename), buffer)

    return NextResponse.json({ url: `/uploads/meals/${filename}` })
  } catch (error) {
    console.error("POST /api/uploads/meal-photos", error)
    return serverError()
  }
}
