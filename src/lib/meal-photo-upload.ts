export async function uploadMealPhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/uploads/meal-photos", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? "Failed to upload image")
  }

  const data = (await res.json()) as { url: string }
  return data.url
}
