/** Normalize a dish name for template matching: lowercase, strip accents, trim */
export function canonicalizeDishName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}
