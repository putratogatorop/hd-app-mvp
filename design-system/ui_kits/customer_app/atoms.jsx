/* global React */
const { useState } = React;

// ────────── TOKENS / ATOMS ──────────
window.HD_COLORS = {
  burgundy: '#650A30',
  burgundyDark: '#40061E',
  burgundyLight: '#801237',
  gold: '#B8922A',
  goldLight: '#F5E6C8',
  cream: '#FEF2E3',
  creamDeep: '#F4E3CA',
  paper: '#FBF6EC',
  ink: '#1A1414',
};

const hdAtomStyles = {
  eyebrow: {
    fontFamily: "'Jost', sans-serif",
    fontSize: 11,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    fontWeight: 500,
    color: '#650A30',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
  },
  numeral: {
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontFeatureSettings: '"tnum","ss02"',
    letterSpacing: '-0.02em',
  },
};

function Eyebrow({ number, children, color = '#650A30', small }) {
  return React.createElement(
    'span',
    { style: { ...hdAtomStyles.eyebrow, color, fontSize: small ? 10 : 11 } },
    number !== undefined && React.createElement(
      'span',
      { style: { ...hdAtomStyles.numeral, fontSize: 11, color: 'rgba(26,20,20,0.6)' } },
      typeof number === 'number' ? String(number).padStart(2, '0') : number,
    ),
    React.createElement('span', { style: { height: 1, width: 24, background: 'rgba(101,10,48,0.6)' } }),
    React.createElement('span', null, children),
  );
}

function Numeral({ children, size = 14, color = '#1A1414', weight = 400 }) {
  return React.createElement(
    'span',
    { style: { ...hdAtomStyles.numeral, fontSize: size, color, fontWeight: weight, lineHeight: 1 } },
    children,
  );
}

function SectionHeader({ number, title, titleItalic, action }) {
  return React.createElement(
    'header',
    { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderBottom: '1px solid rgba(26,20,20,0.15)', paddingBottom: 12 } },
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'baseline', gap: 16 } },
      React.createElement(Numeral, { size: 11, color: 'rgba(26,20,20,0.5)' }, String(number).padStart(2, '0')),
      React.createElement(
        'h2',
        { style: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, margin: 0, letterSpacing: '-0.02em', fontWeight: 500 } },
        title,
        titleItalic && React.createElement('i', { style: { fontWeight: 400 } }, ' ', titleItalic),
      ),
    ),
    action,
  );
}

function Button({ variant = 'primary', size = 'md', children, onClick, style = {}, disabled }) {
  const sizes = { sm: { height: 36, padding: '0 16px' }, md: { height: 48, padding: '0 24px' }, lg: { height: 56, padding: '0 32px' } };
  const variants = {
    primary: { background: '#650A30', color: '#FEF2E3', border: '1px solid #650A30' },
    ink: { background: '#1A1414', color: '#FEF2E3', border: '1px solid #1A1414' },
    ghost: { background: 'transparent', color: '#1A1414', border: '1px solid rgba(26,20,20,0.3)' },
    gold: { background: '#B8922A', color: '#1A1414', border: '1px solid #B8922A' },
  };
  return React.createElement(
    'button',
    {
      onClick, disabled,
      style: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: "'Jost', sans-serif",
        textTransform: 'uppercase', fontSize: size === 'lg' ? 12 : 11, letterSpacing: '0.08em', fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'all 500ms cubic-bezier(0.2,0.8,0.2,1)',
        ...variants[variant], ...sizes[size], ...style,
      },
    },
    children,
  );
}

// ArrowUpRight inline SVG
function IconArrow({ size = 14, color = 'currentColor' }) {
  return React.createElement(
    'svg',
    { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' },
    React.createElement('path', { d: 'M7 7h10v10' }),
    React.createElement('path', { d: 'M7 17 17 7' }),
  );
}

Object.assign(window, { Eyebrow, Numeral, SectionHeader, Button, IconArrow });
