import jsPDF from 'jspdf'
import type { MenuItem, Restaurant } from '@/types'
import type { PresentationStyle } from '@/constants/presentationStyles'

// ── Theme color palettes ────────────────────────────────────────────────────

interface ThemeColors {
  bg: [number, number, number]
  text: [number, number, number]
  accent: [number, number, number]
  muted: [number, number, number]
  cardBg: [number, number, number]
}

const THEME_COLORS: Record<string, ThemeColors> = {
  french_bistro: {
    bg: [250, 248, 245],
    text: [44, 38, 34],
    accent: [201, 169, 97],
    muted: [120, 110, 100],
    cardBg: [255, 255, 255],
  },
  fine_dining: {
    bg: [15, 15, 20],
    text: [255, 255, 255],
    accent: [201, 169, 97],
    muted: [160, 160, 170],
    cardBg: [30, 30, 38],
  },
  street_food: {
    bg: [255, 250, 240],
    text: [50, 40, 30],
    accent: [212, 137, 92],
    muted: [140, 120, 100],
    cardBg: [255, 255, 255],
  },
  asian_fusion: {
    bg: [20, 20, 28],
    text: [240, 240, 245],
    accent: [220, 80, 80],
    muted: [140, 140, 160],
    cardBg: [35, 35, 45],
  },
  mediterranean: {
    bg: [245, 250, 255],
    text: [30, 50, 70],
    accent: [60, 130, 180],
    muted: [120, 140, 160],
    cardBg: [255, 255, 255],
  },
}

// ── Fetch image as base64 data URL ──────────────────────────────────────────

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ── Main PDF generation ─────────────────────────────────────────────────────

export async function generateMenuPdf(
  restaurant: Restaurant,
  items: MenuItem[],
  style: PresentationStyle,
  onProgress?: (pct: number) => void,
): Promise<Blob> {
  const colors = THEME_COLORS[style.id] ?? THEME_COLORS.french_bistro
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const H = 297
  const MARGIN = 15
  const CONTENT_W = W - MARGIN * 2

  // ── Cover page ──────────────────────────────────────────────────────────────

  // Background
  pdf.setFillColor(...colors.bg)
  pdf.rect(0, 0, W, H, 'F')

  // Restaurant name
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(32)
  pdf.setTextColor(...colors.text)
  const nameLines = pdf.splitTextToSize(restaurant.name || 'Menu', CONTENT_W)
  pdf.text(nameLines, W / 2, 80, { align: 'center' })

  // Style badge
  pdf.setFontSize(14)
  pdf.setTextColor(...colors.accent)
  pdf.text(`${style.emoji}  ${style.label}`, W / 2, 100, { align: 'center' })

  // Subtitle
  if (restaurant.description) {
    pdf.setFontSize(10)
    pdf.setTextColor(...colors.muted)
    const descLines = pdf.splitTextToSize(restaurant.description, CONTENT_W - 20)
    pdf.text(descLines, W / 2, 115, { align: 'center' })
  }

  // Address + phone
  pdf.setFontSize(9)
  pdf.setTextColor(...colors.muted)
  let infoY = 250
  if (restaurant.address) {
    pdf.text(restaurant.address, W / 2, infoY, { align: 'center' })
    infoY += 5
  }
  if (restaurant.phone) {
    pdf.text(restaurant.phone, W / 2, infoY, { align: 'center' })
  }

  // Decorative line
  pdf.setDrawColor(...colors.accent)
  pdf.setLineWidth(0.5)
  pdf.line(W / 2 - 30, 105, W / 2 + 30, 105)

  // ── Content pages — group items by category ─────────────────────────────────

  const photosItems = items.filter((i) => i.image_url)
  const categories = [...new Set(photosItems.map((i) => i.categorie).filter(Boolean))]
  const totalItems = photosItems.length
  let processedItems = 0

  for (const category of categories) {
    const catItems = photosItems.filter((i) => i.categorie === category)

    pdf.addPage()
    pdf.setFillColor(...colors.bg)
    pdf.rect(0, 0, W, H, 'F')

    // Category header
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    pdf.setTextColor(...colors.accent)
    pdf.text(category.toUpperCase(), MARGIN, 25)

    // Decorative line under category
    pdf.setDrawColor(...colors.accent)
    pdf.setLineWidth(0.3)
    pdf.line(MARGIN, 28, MARGIN + 40, 28)

    let y = 38

    for (const item of catItems) {
      // Check if we need a new page (need ~65mm per item with photo)
      if (y + 60 > H - MARGIN) {
        pdf.addPage()
        pdf.setFillColor(...colors.bg)
        pdf.rect(0, 0, W, H, 'F')
        y = 20
      }

      // Card background
      pdf.setFillColor(...colors.cardBg)
      const cardH = item.image_url ? 55 : 25
      pdf.roundedRect(MARGIN, y, CONTENT_W, cardH, 3, 3, 'F')

      // Photo (left side)
      if (item.image_url) {
        const dataUrl = await fetchImageAsDataUrl(item.image_url)
        if (dataUrl) {
          try {
            pdf.addImage(dataUrl, 'JPEG', MARGIN + 2, y + 2, 50, 50, undefined, 'FAST')
          } catch {
            // Skip image if it fails to load
          }
        }
      }

      // Text (right of photo or full width)
      const textX = item.image_url ? MARGIN + 56 : MARGIN + 5
      const textW = item.image_url ? CONTENT_W - 60 : CONTENT_W - 10

      // Name
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(...colors.text)
      const nameText = pdf.splitTextToSize(item.nom, textW - 25)
      pdf.text(nameText, textX, y + 8)

      // Price (right-aligned)
      if (item.prix) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.setTextColor(...colors.accent)
        pdf.text(item.prix, MARGIN + CONTENT_W - 5, y + 8, { align: 'right' })
      }

      // Description
      if (item.description) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor(...colors.muted)
        const descText = pdf.splitTextToSize(item.description, textW)
        const maxDescLines = item.image_url ? 4 : 2
        pdf.text(descText.slice(0, maxDescLines), textX, y + 14)
      }

      y += cardH + 5

      processedItems++
      onProgress?.(Math.round((processedItems / totalItems) * 100))
    }
  }

  // ── Items without photos — text-only list ─────────────────────────────────

  const noPhotoItems = items.filter((i) => !i.image_url)
  if (noPhotoItems.length > 0) {
    const noPhotoCategories = [...new Set(noPhotoItems.map((i) => i.categorie).filter(Boolean))]

    for (const category of noPhotoCategories) {
      const catItems = noPhotoItems.filter((i) => i.categorie === category)

      pdf.addPage()
      pdf.setFillColor(...colors.bg)
      pdf.rect(0, 0, W, H, 'F')

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(20)
      pdf.setTextColor(...colors.accent)
      pdf.text(category.toUpperCase(), MARGIN, 25)

      pdf.setDrawColor(...colors.accent)
      pdf.setLineWidth(0.3)
      pdf.line(MARGIN, 28, MARGIN + 40, 28)

      let y = 38

      for (const item of catItems) {
        if (y + 20 > H - MARGIN) {
          pdf.addPage()
          pdf.setFillColor(...colors.bg)
          pdf.rect(0, 0, W, H, 'F')
          y = 20
        }

        // Name + price on same line
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.setTextColor(...colors.text)
        pdf.text(item.nom, MARGIN + 3, y + 5)

        if (item.prix) {
          pdf.setTextColor(...colors.accent)
          pdf.text(item.prix, MARGIN + CONTENT_W - 3, y + 5, { align: 'right' })
        }

        // Dotted line between name and price
        pdf.setDrawColor(...colors.muted)
        pdf.setLineWidth(0.1)
        const nameWidth = pdf.getTextWidth(item.nom) + MARGIN + 5
        const priceX = item.prix ? MARGIN + CONTENT_W - 3 - pdf.getTextWidth(item.prix) - 2 : MARGIN + CONTENT_W - 3
        if (priceX > nameWidth) {
          for (let dx = nameWidth; dx < priceX; dx += 2) {
            pdf.line(dx, y + 5, dx + 0.5, y + 5)
          }
        }

        // Description
        if (item.description) {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(8)
          pdf.setTextColor(...colors.muted)
          const descLines = pdf.splitTextToSize(item.description, CONTENT_W - 6)
          pdf.text(descLines.slice(0, 2), MARGIN + 3, y + 10)
          y += 8
        }

        y += 12
      }
    }
  }

  return pdf.output('blob')
}
