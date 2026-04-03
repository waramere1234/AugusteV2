import type { MenuItem } from '@/types'

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','))
  }
  return lines.join('\n')
}

function downloadCsv(content: string, filename: string) {
  const bom = '\uFEFF' // UTF-8 BOM for Excel
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Uber Eats format ────────────────────────────────────────────────────────

export function exportUberEatsCsv(items: MenuItem[], restaurantName: string) {
  const headers = [
    'Category',
    'Item Name',
    'Description',
    'Price',
    'Image URL',
    'Tax Rate (%)',
    'Dietary Info',
  ]

  const rows = items.map((item) => [
    item.categorie || '',
    item.nom,
    item.description || '',
    item.prix || '',
    item.image_url || '',
    '',
    (item.labels || []).join('; '),
  ])

  const csv = buildCsv(headers, rows)
  downloadCsv(csv, `${restaurantName || 'menu'}_uber_eats.csv`)
}

// ── Deliveroo format ────────────────────────────────────────────────────────

export function exportDeliverooCsv(items: MenuItem[], restaurantName: string) {
  const headers = [
    'Category',
    'Item Name',
    'Operational Name',
    'Description',
    'Price',
    'Image URL',
    'Allergens',
    'Dietary Info',
    'Stock Status',
  ]

  const rows = items.map((item) => [
    item.categorie || '',
    item.nom,
    item.nom,
    item.description || '',
    item.prix || '',
    item.image_url || '',
    (item.allergenes || []).join('; '),
    (item.labels || []).join('; '),
    'available',
  ])

  const csv = buildCsv(headers, rows)
  downloadCsv(csv, `${restaurantName || 'menu'}_deliveroo.csv`)
}
