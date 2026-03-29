/** Convert a File to raw base64 string (no data:...;base64, prefix) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Resize an image File to max dimension and return raw base64 (no prefix).
 * Keeps aspect ratio. Output as JPEG quality 0.85 to stay under Supabase body limits.
 */
export function resizeImageToBase64(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      resolve(dataUrl.split(',')[1])
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Guess MIME type from file extension when File.type is empty (e.g. HEIC on some devices) */
export function guessMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', heic: 'image/heic', pdf: 'application/pdf',
  }
  return map[ext ?? ''] ?? ''
}

/** Extract a human-readable error from a Supabase Edge Function error object */
export async function extractEdgeFunctionError(
  fnError: { message?: string; context?: unknown },
): Promise<string> {
  const ctx = fnError.context
  if (ctx && typeof ctx === 'object') {
    if ('json' in ctx && typeof (ctx as Response).json === 'function') {
      try {
        const body = await (ctx as Response).json()
        if (typeof body.error === 'string') return body.error
        if (typeof body.message === 'string') return body.message
      } catch { /* not parseable */ }
    }
    const obj = ctx as Record<string, unknown>
    if (typeof obj.error === 'string') return obj.error
    if (typeof obj.message === 'string') return obj.message
  }
  return fnError.message || 'error.menu.extractionFailed'
}
