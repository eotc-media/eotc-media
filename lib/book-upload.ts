// Browser-side upload for book files.
//
// The cover is resized and re-encoded here rather than on the server: it saves
// the reader's upload time as much as ours, and a 2 MB phone photo becomes
// about 30 KB before it ever leaves the machine.
//
// Both files then go straight to R2 through a presigned URL. Vercel rejects a
// request body over 4.5 MB before the function runs, so a book of any real
// size could never have been forwarded through it.

const COVER_MAX_WIDTH = 600
const COVER_QUALITY = 0.8

/** Resize and re-encode a cover to WebP. Returns the original if it cannot. */
export async function compressCoverInBrowser(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, COVER_MAX_WIDTH / bitmap.width)
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", COVER_QUALITY)
    )
    // Re-encoding an already-small image can come out larger.
    return blob && blob.size < file.size ? blob : file
  } catch {
    // An image the browser cannot decode is uploaded as it came; the server
    // still checks its type and size.
    return file
  }
}

/** PUT to a presigned URL, reporting progress. XHR, because fetch cannot. */
function putWithProgress(url: string, body: Blob, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", body.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`))
    xhr.onerror = () => reject(new Error("Upload failed. Please check your connection."))
    xhr.send(body)
  })
}

/**
 * Upload one file to R2 and return the filename the book record should store.
 */
export async function uploadBookFile(
  kind: "files" | "images",
  body: Blob,
  onProgress: (pct: number) => void
): Promise<string> {
  const res = await fetch("/api/books/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: body.type, size: body.size }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.error ?? "Could not start the upload.")
  }
  const { url, filename } = await res.json()

  await putWithProgress(url, body, onProgress)
  return filename as string
}
