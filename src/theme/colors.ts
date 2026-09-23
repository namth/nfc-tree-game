/**
 * Theme Color Palettes (Dark & Light Zen Themes)
 * Project: Fractal Tree NFC Mobile Game
 */

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;
  cardSelected: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  danger: string;
  dangerLight: string;
  groundBox: string;
  groundBoxBorder: string;
  canvasBg: string;
  navBarBg: string;
  modalOverlay: string;
  statusBar: 'light-content' | 'dark-content';
}

export const darkColors: ThemeColors = {
  background: '#080b0a',
  surface: '#121915',
  surfaceSecondary: '#18221c',
  card: '#121915',
  cardSelected: '#1a2620',
  text: '#ffffff',
  textSecondary: '#86a397',
  textMuted: '#526b5d',
  border: 'rgba(74, 222, 128, 0.16)',
  borderStrong: 'rgba(74, 222, 128, 0.32)',
  primary: '#4ade80',
  primaryLight: 'rgba(74, 222, 128, 0.15)',
  primaryDark: '#22c55e',
  accent: '#38bdf8',
  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  groundBox: '#0d1411',
  groundBoxBorder: 'rgba(74, 222, 128, 0.2)',
  canvasBg: '#080b0a',
  navBarBg: 'rgba(8, 11, 10, 0.95)',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  statusBar: 'light-content'
};

export const lightColors: ThemeColors = {
  background: '#f4f7f4',
  surface: '#ffffff',
  surfaceSecondary: '#ebf3ed',
  card: '#ffffff',
  cardSelected: '#e5f3ea',
  text: '#112017',
  textSecondary: '#446050',
  textMuted: '#718d7e',
  border: 'rgba(34, 197, 94, 0.22)',
  borderStrong: 'rgba(34, 197, 94, 0.40)',
  primary: '#16a34a',
  primaryLight: 'rgba(22, 163, 74, 0.12)',
  primaryDark: '#15803d',
  accent: '#0284c7',
  danger: '#dc2626',
  dangerLight: 'rgba(220, 38, 38, 0.12)',
  groundBox: '#ebf3ed',
  groundBoxBorder: 'rgba(34, 197, 94, 0.25)',
  canvasBg: '#f4f7f4',
  navBarBg: 'rgba(244, 247, 244, 0.95)',
  modalOverlay: 'rgba(0, 0, 0, 0.55)',
  statusBar: 'dark-content'
};
