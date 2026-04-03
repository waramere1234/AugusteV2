import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { MenuItem } from '@/types'

export async function downloadPhotosZip(
  items: MenuItem[],
  restaurantName: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const photosItems = items.filter((i) => i.image_url)
  if (photosItems.length === 0) return

  const zip = new JSZip()
  const folder = zip.folder(restaurantName.replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '').trim() || 'photos')!

  for (let i = 0; i < photosItems.length; i++) {
    const item = photosItems[i]
    try {
      const res = await fetch(item.image_url!)
      const blob = await res.blob()
      const ext = blob.type.includes('webp') ? 'webp' : blob.type.includes('png') ? 'png' : 'jpg'
      const safeName = item.nom.replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '').trim()
      folder.file(`${safeName}.${ext}`, blob)
    } catch {
      // Skip failed downloads
    }
    onProgress?.(Math.round(((i + 1) / photosItems.length) * 100))
  }

  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `${restaurantName || 'photos'}.zip`)
}
