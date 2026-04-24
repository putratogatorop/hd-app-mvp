/* global React, Eyebrow, Numeral, SectionHeader, Button, IconArrow */

function Masthead({ greeting, name = 'Putra', date }) {
  // Derive a time-of-day greeting if one isn't passed in (Bahasa Indonesia).
  const now = new Date();
  const h = now.getHours();
  const derivedGreeting = greeting || (
    h < 11 ? 'Selamat pagi' :
    h < 15 ? 'Selamat siang' :
    h < 18 ? 'Selamat sore' : 'Selamat malam'
  );
  const derivedDate = date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  return React.createElement(
    'section',
    { style: { position: 'relative', overflow: 'hidden', background: '#40061E', color: '#FEF2E3' } },
    // Grain layer
    React.createElement('div', {
      'aria-hidden': 'true',
      style: {
        position: 'absolute', inset: 0, opacity: 0.35, mixBlendMode: 'multiply', pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.08 0 0 0 0.35 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        backgroundSize: '180px 180px',
      },
    }),
    // Gold radial glow (per README vibe notes)
    React.createElement('div', {
      'aria-hidden': 'true',
      style: { position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 75% 18%, rgba(184,146,42,0.28), transparent 55%)' },
    }),
    React.createElement(
      'div',
      { style: { position: 'relative', padding: '48px 20px 40px' } },
      React.createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(254,242,227,0.25)', paddingBottom: 12 } },
        React.createElement('img', { src: '../../assets/logos/haagen-dazs-logo-transparent.png', alt: 'Häagen-Dazs', style: { height: 30, width: 'auto' } }),
        React.createElement(Numeral, { size: 10, color: 'rgba(254,242,227,0.7)' }, derivedDate),
      ),
      React.createElement(
        'div',
        { style: { marginTop: 40 } },
        React.createElement('span', { style: { fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#F5E6C8', fontWeight: 500 } }, `${derivedGreeting}, ${name}`),
        React.createElement('h1', { style: { marginTop: 20, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 48, lineHeight: 0.95, letterSpacing: '-0.02em', fontWeight: 500, color: '#FEF2E3' } },
          'Ice Cream, ',
          React.createElement('span', { style: { fontStyle: 'italic', fontWeight: 400 } }, 'perfected.')),
        React.createElement('p', { style: { marginTop: 20, maxWidth: 300, fontSize: 14, lineHeight: 1.55, color: 'rgba(254,242,227,0.8)' } },
          "A small luxury, measured in spoonfuls. Choose a store below and we'll see to the rest."),
      ),
    ),
  );
}

function MemberStrip({ points = 1250, tier = 'Gold', target = 2000, next = 'Platinum', onRewards }) {
  const pct = Math.min(100, (points / target) * 100);
  return React.createElement(
    'section',
    { style: { padding: '24px 20px', borderBottom: '1px solid rgba(43,43,43,0.12)', background: '#FEF2E3' } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
      React.createElement('div', null,
        React.createElement(Eyebrow, { color: 'rgba(43,43,43,0.75)', small: true }, `Member · ${tier}`),
        React.createElement('div', { style: { marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 } },
          React.createElement(Numeral, { size: 36, weight: 500 }, points.toLocaleString('en-US')),
          React.createElement('span', { style: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(43,43,43,0.75)' } }, 'points'),
        ),
      ),
      React.createElement('button', {
        type: 'button', onClick: onRewards, className: 'tap',
        'aria-label': 'Open rewards',
        style: {
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 4px',
          minHeight: 44, minWidth: 44, justifyContent: 'center',
        },
      },
        React.createElement(IconArrow, { size: 16, color: '#650A30' }),
        React.createElement(Eyebrow, { small: true }, 'Rewards'),
      ),
    ),
    React.createElement('div', { style: { marginTop: 18 } },
      React.createElement('div', { style: { height: 2, width: '100%', background: 'rgba(43,43,43,0.12)', position: 'relative' } },
        React.createElement('div', { style: { position: 'absolute', inset: 0, width: `${pct}%`, background: '#650A30', transition: 'width 900ms' } }),
      ),
      React.createElement('div', { style: { marginTop: 8, display: 'flex', justifyContent: 'space-between' } },
        React.createElement(Numeral, { size: 10, color: 'rgba(43,43,43,0.75)' }, `${points.toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`),
        React.createElement('span', { style: { ...hdAtomStyles.eyebrow, fontSize: 10, color: 'rgba(43,43,43,0.75)' } },
          React.createElement(Numeral, { size: 11 }, target - points), ' to ', next),
      ),
    ),
  );
}

function OrderModes({ mode, onSelect }) {
  const modes = [
    { key: 'pickup', roman: 'I', title: 'Pick Up', tagline: 'Collected at the counter' },
    { key: 'delivery', roman: 'II', title: 'Delivery', tagline: 'Brought to the door' },
    { key: 'dinein', roman: 'III', title: 'Dine In', tagline: 'At table, unhurried' },
  ];
  return React.createElement(
    'section',
    { style: { padding: '40px 20px 0' } },
    React.createElement(SectionHeader, { number: 1, title: 'How will you have it?' }),
    React.createElement('div', { style: { marginTop: 24, borderTop: '1px solid rgba(43,43,43,0.12)', borderBottom: '1px solid rgba(43,43,43,0.12)', background: '#FEF2E3' } },
      modes.map((m, i) => {
        const active = mode === m.key;
        return React.createElement('button', {
          key: m.key, type: 'button', onClick: () => onSelect(m.key), className: 'tap',
          'aria-pressed': active,
          style: {
            display: 'flex', alignItems: 'center', gap: 20, padding: '20px', width: '100%', textAlign: 'left',
            borderTop: i === 0 ? 'none' : '1px solid rgba(43,43,43,0.12)',
            borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
            background: active ? '#650A30' : 'transparent', color: active ? '#FEF2E3' : '#2B2B2B',
            cursor: 'pointer', transition: 'background 300ms, color 300ms',
            minHeight: 44,
          },
        },
          React.createElement(Numeral, { size: 13, color: active ? '#F5E6C8' : 'rgba(43,43,43,0.75)' }, m.roman),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, letterSpacing: '-0.02em', fontStyle: active ? 'italic' : 'normal' } }, m.title),
            React.createElement('div', { style: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontSize: 12, marginTop: 4, color: active ? 'rgba(254,242,227,0.7)' : 'rgba(43,43,43,0.75)' } }, m.tagline),
          ),
          React.createElement(IconArrow, { size: 18, color: active ? '#FEF2E3' : 'rgba(43,43,43,0.75)' }),
        );
      }),
    ),
  );
}

function Shortlist({ items, onAdd, onAllClick }) {
  return React.createElement(
    'section',
    { style: { padding: '40px 0 0' } },
    React.createElement('div', { style: { padding: '0 20px' } },
      React.createElement(SectionHeader, {
        number: 2, title: 'The', titleItalic: 'shortlist',
        action: React.createElement('button', {
          type: 'button', onClick: onAllClick, className: 'tap',
          'aria-label': 'View all menu items',
          style: {
            ...hdAtomStyles.eyebrow, fontSize: 11, display: 'inline-flex', gap: 8, alignItems: 'center',
            cursor: 'pointer', background: 'transparent', border: 'none',
            padding: '12px 8px', minHeight: 44, minWidth: 44, font: 'inherit',
          },
        }, 'All ', React.createElement(IconArrow, { size: 12 })),
      }),
    ),
    React.createElement('div', { style: { display: 'flex', gap: 16, overflowX: 'auto', padding: '24px 20px 8px' }, className: 'no-scrollbar' },
      items.map((it, i) =>
        React.createElement('button', {
          key: it.id, type: 'button', onClick: () => onAdd(it), className: 'tap',
          'aria-label': `Add ${it.name} to bag`,
          style: { flexShrink: 0, width: 160, textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' },
        },
          React.createElement('div', { style: { position: 'relative', aspectRatio: '4/5', background: '#F5E6C8', overflow: 'hidden' } },
            React.createElement('img', { src: it.image, alt: '', style: { width: '100%', height: '100%', objectFit: 'cover' } }),
            React.createElement('span', { style: {
              position: 'absolute', top: 10, left: 10, ...hdAtomStyles.numeral, fontSize: 10,
              color: '#FEF2E3', textShadow: '0 1px 8px rgba(43,43,43,0.45)',
            } }, String(i + 1).padStart(3, '0')),
          ),
          React.createElement('div', { style: { marginTop: 12 } },
            React.createElement('div', { style: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, lineHeight: 1.15, letterSpacing: '-0.02em' } }, it.name),
            React.createElement('div', { style: { marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(43,43,43,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement(Numeral, { size: 13 }, it.price),
              React.createElement('span', { style: { ...hdAtomStyles.eyebrow, fontSize: 10 } }, 'Add'),
            ),
          ),
        ),
      ),
    ),
  );
}

function BottomNav({ active, onSelect }) {
  const tabs = [
    { key: 'beranda', label: 'Beranda' },
    { key: 'menu', label: 'Menu' },
    { key: 'pesanan', label: 'Pesanan' },
    { key: 'hadiah', label: 'Hadiah' },
    { key: 'akun', label: 'Akun' },
  ];
  return React.createElement(
    'nav',
    { 'aria-label': 'Primary', style: { position: 'absolute', bottom: 0, left: 0, right: 0, background: '#FEF2E3', borderTop: '1px solid rgba(43,43,43,0.12)', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' } },
    React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' } },
      tabs.map(t => {
        const on = active === t.key;
        return React.createElement('button', {
          key: t.key, type: 'button', onClick: () => onSelect(t.key), className: 'tap',
          'aria-current': on ? 'page' : undefined,
          'aria-label': t.label,
          style: { position: 'relative', minHeight: 56, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer' },
        },
          React.createElement('span', { style: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: on ? '#650A30' : '#2B2B2B', fontStyle: on ? 'italic' : 'normal', fontWeight: on ? 500 : 400, lineHeight: 1 } }, t.label),
          on && React.createElement('span', { style: { position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', height: 2, width: 40, background: '#650A30' } }),
        );
      }),
    ),
  );
}

Object.assign(window, { Masthead, MemberStrip, OrderModes, Shortlist, BottomNav });
