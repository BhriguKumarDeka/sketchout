export interface ThemeColorDef {
  dark: string;
  light: string;
  label: string;
}

export const PALETTE_STROKE_COLORS: ThemeColorDef[] = [
  { dark: '#f4f4f5', light: '#18181b', label: 'Primary (White/Charcoal)' },
  { dark: '#d4d4d8', light: '#3f3f46', label: 'Silver/Slate' },
  { dark: '#71717a', light: '#52525b', label: 'Zinc' },
  { dark: '#27272a', light: '#a1a1aa', label: 'Muted Contrast' },
  { dark: '#4ade80', light: '#16a34a', label: 'Mint/Emerald Green' },
  { dark: '#60a5fa', light: '#2563eb', label: 'Sky/Royal Blue' },
  { dark: '#fbbf24', light: '#d97706', label: 'Amber' },
  { dark: '#f87171', light: '#dc2626', label: 'Coral/Ruby' },
];

export const PALETTE_FILL_COLORS: ThemeColorDef[] = [
  { dark: 'transparent', light: 'transparent', label: 'None' },
  { dark: '#121215', light: '#ffffff', label: 'Base Surface' },
  { dark: '#18181b', light: '#f4f4f5', label: 'Card Surface' },
  { dark: '#27272a', light: '#e4e4e7', label: 'Elevated' },
  { dark: 'rgba(74, 222, 128, 0.18)', light: 'rgba(22, 163, 74, 0.14)', label: 'Green Tint' },
  { dark: 'rgba(96, 165, 250, 0.18)', light: 'rgba(37, 99, 235, 0.14)', label: 'Blue Tint' },
  { dark: 'rgba(251, 191, 36, 0.18)', light: 'rgba(217, 119, 6, 0.14)', label: 'Amber Tint' },
  { dark: 'rgba(248, 113, 113, 0.18)', light: 'rgba(220, 38, 38, 0.14)', label: 'Coral Tint' },
];

export function adaptColorForTheme(color: string | undefined, isLight: boolean): string {
  if (!color || color === 'transparent') return 'transparent';

  const match = [...PALETTE_STROKE_COLORS, ...PALETTE_FILL_COLORS].find(
    (c) => c.dark.toLowerCase() === color.toLowerCase() || c.light.toLowerCase() === color.toLowerCase()
  );

  if (match) {
    return isLight ? match.light : match.dark;
  }

  // Common fallbacks for monochrome
  const lower = color.toLowerCase();
  if (lower === '#ffffff' || lower === '#fafafa' || lower === '#f4f4f5') {
    return isLight ? '#18181b' : '#f4f4f5';
  }
  if (lower === '#000000' || lower === '#09090b' || lower === '#18181b') {
    return isLight ? '#18181b' : '#f4f4f5';
  }

  return color;
}
