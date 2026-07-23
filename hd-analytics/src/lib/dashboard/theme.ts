/**
 * Shared editorial theme for the analytics surfaces.
 * Keeps the dark "maison after hours" feel but uses HD brand tokens
 * so charts/cards align with the customer app aesthetic.
 */

export const DASH_COLORS = {
  // Surfaces
  bg: '#1C0810',            // warm burgundy-tinted noir
  bgSoft: '#25121A',        // slightly raised bg for gradients
  card: '#2A0F1C',          // card surface
  cardHover: '#341424',
  border: 'rgba(184, 146, 42, 0.18)',
  borderStrong: 'rgba(184, 146, 42, 0.35)',
  divider: 'rgba(254, 242, 227, 0.08)',

  // HD brand
  burgundy: '#650A30',
  burgundyLight: '#801237',
  burgundyDark: '#40061E',
  gold: '#B8922A',
  goldLight: '#F5E6C8',
  cream: '#FEF2E3',

  // Text
  textPrimary: '#FEF2E3',   // cream
  textSecondary: 'rgba(254, 242, 227, 0.65)',
  textMuted: 'rgba(254, 242, 227, 0.4)',

  // Status
  emerald: '#4ECDC4',
  emeraldSoft: 'rgba(78, 205, 196, 0.15)',
  red: '#D96C6C',
  redSoft: 'rgba(217, 108, 108, 0.15)',
}

// Recharts-friendly axis/grid defaults
export const axisStyle = {
  fill: DASH_COLORS.textMuted,
  fontSize: 10,
  fontFamily: 'var(--font-instrument, sans-serif)',
}
export const gridStyle = {
  stroke: DASH_COLORS.divider,
  strokeDasharray: '2 4',
}
