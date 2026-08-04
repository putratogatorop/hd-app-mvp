/**
 * Shared theme for the analytics surfaces. Light (neutral SaaS white) is the
 * default; dark ("maison after hours" burgundy noir) is available as a toggle.
 * Burgundy/gold/emerald/red are brand accents and stay constant across both
 * themes — only surface and text colors change.
 */

export type ThemeName = 'light' | 'dark'

const ACCENTS = {
  burgundy: '#650A30',
  burgundyLight: '#801237',
  gold: '#B8922A',
  goldLight: '#F5E6C8',
  emerald: '#4ECDC4',
  emeraldSoft: 'rgba(78, 205, 196, 0.15)',
  red: '#D96C6C',
  redSoft: 'rgba(217, 108, 108, 0.15)',
}

const DARK = {
  ...ACCENTS,
  bg: '#1C0810',
  card: '#2A0F1C',
  cardHover: '#341424',
  headerBg: 'rgba(28, 8, 16, 0.88)',
  border: 'rgba(184, 146, 42, 0.18)',
  borderStrong: 'rgba(184, 146, 42, 0.35)',
  cardBorder: '#3d1825',
  divider: 'rgba(254, 242, 227, 0.08)',
  textPrimary: '#FEF2E3',
  textSecondary: 'rgba(254, 242, 227, 0.65)',
  textMuted: 'rgba(254, 242, 227, 0.4)',
  onAccent: '#FEF2E3',
}

const LIGHT = {
  ...ACCENTS,
  bg: '#F7F7F9',
  card: '#FFFFFF',
  cardHover: '#F3F4F6',
  headerBg: 'rgba(255, 255, 255, 0.85)',
  border: 'rgba(20, 20, 20, 0.08)',
  borderStrong: 'rgba(20, 20, 20, 0.14)',
  cardBorder: '#E5E7EB',
  divider: 'rgba(20, 20, 20, 0.06)',
  textPrimary: '#1A1414',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  onAccent: '#FFFFFF',
}

export function getDashColors(theme: ThemeName) {
  return theme === 'dark' ? DARK : LIGHT
}
