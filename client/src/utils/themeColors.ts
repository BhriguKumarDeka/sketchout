export type ThemeMode = 'dark' | 'light' | 'cutting-mat';

export interface ThemeColorDef {
  dark: string;
  light: string;
  cuttingMat?: string;
  label: string;
}

export const PALETTE_STROKE_COLORS: ThemeColorDef[] = [
  { dark: '#f4f4f5', light: '#18181b', cuttingMat: '#facc15', label: 'Primary (White/Charcoal/Yellow)' },
  { dark: '#d4d4d8', light: '#3f3f46', cuttingMat: '#fde047', label: 'Silver/Slate/Bright Gold' },
  { dark: '#71717a', light: '#52525b', cuttingMat: '#eab308', label: 'Zinc/Amber' },
  { dark: '#27272a', light: '#a1a1aa', cuttingMat: '#ca8a04', label: 'Muted Contrast' },
  { dark: '#4ade80', light: '#16a34a', cuttingMat: '#86efac', label: 'Mint/Emerald Green' },
  { dark: '#60a5fa', light: '#2563eb', cuttingMat: '#38bdf8', label: 'Sky/Royal Blue' },
  { dark: '#fbbf24', light: '#d97706', cuttingMat: '#fb923c', label: 'Amber/Orange' },
  { dark: '#f87171', light: '#dc2626', cuttingMat: '#f87171', label: 'Coral/Ruby' },
];

export const PALETTE_FILL_COLORS: ThemeColorDef[] = [
  { dark: 'transparent', light: 'transparent', cuttingMat: 'transparent', label: 'None' },
  { dark: '#121215', light: '#ffffff', cuttingMat: '#143526', label: 'Base Surface' },
  { dark: '#18181b', light: '#f4f4f5', cuttingMat: '#1a4230', label: 'Card Surface' },
  { dark: '#27272a', light: '#e4e4e7', cuttingMat: '#22523d', label: 'Elevated' },
  { dark: 'rgba(251, 191, 36, 0.18)', light: 'rgba(217, 119, 6, 0.14)', cuttingMat: 'rgba(250, 204, 21, 0.18)', label: 'Yellow Tint' },
  { dark: 'rgba(74, 222, 128, 0.18)', light: 'rgba(22, 163, 74, 0.14)', cuttingMat: 'rgba(134, 239, 172, 0.18)', label: 'Green Tint' },
  { dark: 'rgba(96, 165, 250, 0.18)', light: 'rgba(37, 99, 235, 0.14)', cuttingMat: 'rgba(56, 189, 248, 0.18)', label: 'Blue Tint' },
  { dark: 'rgba(248, 113, 113, 0.18)', light: 'rgba(220, 38, 38, 0.14)', cuttingMat: 'rgba(248, 113, 113, 0.18)', label: 'Coral Tint' },
];

export function adaptColorForTheme(
  color: string | undefined,
  themeOrIsLight: ThemeMode | boolean
): string {
  if (!color || color === 'transparent') return 'transparent';

  const mode: ThemeMode =
    typeof themeOrIsLight === 'string'
      ? themeOrIsLight
      : themeOrIsLight
      ? 'light'
      : 'dark';

  const match = [...PALETTE_STROKE_COLORS, ...PALETTE_FILL_COLORS].find(
    (c) =>
      c.dark.toLowerCase() === color.toLowerCase() ||
      c.light.toLowerCase() === color.toLowerCase() ||
      (c.cuttingMat && c.cuttingMat.toLowerCase() === color.toLowerCase())
  );

  if (match) {
    if (mode === 'cutting-mat') return match.cuttingMat || '#facc15';
    return mode === 'light' ? match.light : match.dark;
  }

  // Common fallbacks for monochrome
  const lower = color.toLowerCase();
  if (lower === '#ffffff' || lower === '#fafafa' || lower === '#f4f4f5') {
    if (mode === 'cutting-mat') return '#facc15';
    return mode === 'light' ? '#18181b' : '#f4f4f5';
  }
  if (lower === '#000000' || lower === '#09090b' || lower === '#18181b') {
    if (mode === 'cutting-mat') return '#facc15';
    return mode === 'light' ? '#18181b' : '#f4f4f5';
  }

  return color;
}
