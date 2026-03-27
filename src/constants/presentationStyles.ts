export interface PresentationStyle {
  id: string;
  emoji: string;
  label: string;
  hint: string;
}

export const PRESENTATION_STYLES: PresentationStyle[] = [
  { id: 'french_bistro', emoji: '\u{1F950}', label: 'Bistrot Français', hint: 'rustic French bistro presentation, checkered tablecloth, zinc bar, Parisian brasserie atmosphere' },
  { id: 'fine_dining', emoji: '\u{1F37D}\uFE0F', label: 'Gastronomique', hint: 'fine dining restaurant, white linen tablecloth, crystal glasses, elegant plating, upscale atmosphere' },
  { id: 'street_food', emoji: '\u{1F959}', label: 'Street Food', hint: 'authentic street food stall, bold portions, kraft paper, food truck atmosphere, vibrant and casual' },
  { id: 'asian_fusion', emoji: '\u{1F962}', label: 'Asiatique', hint: 'modern Asian fusion restaurant, sleek dark surfaces, neon accents, dynamic urban atmosphere' },
  { id: 'mediterranean', emoji: '\u{1FAD2}', label: 'Méditerranéen', hint: 'Mediterranean coastal setting, blue and white tones, olive wood, terrace by the sea atmosphere' },
];

/** Find a style by matching its hint prefix in a stored description string */
export function findStyleByHint(description: string): PresentationStyle | null {
  if (!description) return null;
  return PRESENTATION_STYLES.find(s => description.startsWith(s.hint)) ?? null;
}
