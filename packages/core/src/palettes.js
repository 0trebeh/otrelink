// ─────────────────────────────────────────────────────────────
//  COLOR PALETTES
//  A palette recolors a page without touching its fonts, button shapes or
//  background type: background, cards, text, buttons and accent all change
//  together (dashboard → Theme → Color palettes).
//
//  palette.colors = {
//    bg, bg2      background and its second color (gradients, patterns)
//    surface      cards (FAQ, text cards, catalog…)
//    text         titles and text
//    primary      buttons
//    accent       highlights: badges, Buy buttons, avatar ring
//  }
//  To add a preset: append to PALETTES.
// ─────────────────────────────────────────────────────────────
import { createRegistry } from './util/registry.js';

const p = (id, label, dark, bg, bg2, surface, text, primary, accent) => ({ id, label, dark, colors: { bg, bg2, surface, text, primary, accent } });

export const palettes = createRegistry('palettes', [
  // Light
  p('ink', 'Classic ink', false, '#f7f7f5', '#e9e9e4', '#ffffff', '#111111', '#111111', '#ff5a36'),
  p('ocean-breeze', 'Ocean breeze', false, '#eef8fb', '#cdeef5', '#ffffff', '#0b3040', '#0e7490', '#f59e0b'),
  p('meadow', 'Meadow', false, '#f1f5ee', '#dbe7d3', '#ffffff', '#1d3324', '#2f6b3a', '#d97706'),
  p('sunset', 'Sunset', false, '#fff4ea', '#ffd6b8', '#ffffff', '#3a0f2a', '#e4572e', '#7b2e5c'),
  p('lavender', 'Lavender', false, '#f6f3ff', '#e4dcff', '#ffffff', '#2a1f4d', '#7c3aed', '#ec4899'),
  p('peach', 'Peach', false, '#fff1ec', '#ffd9cc', '#fffaf7', '#4a2a20', '#ff7a59', '#2a9d8f'),
  p('mint', 'Mint', false, '#effbf6', '#c9f2df', '#ffffff', '#0f3d2e', '#0f9f6e', '#6366f1'),
  p('sand', 'Sand', false, '#fbf7ef', '#efe3cc', '#fffdf8', '#3d3020', '#a0703c', '#3f6e5f'),
  p('rose', 'Rose', false, '#fff0f3', '#ffd1dc', '#ffffff', '#4c1023', '#e11d48', '#0284c7'),
  p('sky', 'Sky', false, '#f0f7ff', '#d6e9ff', '#ffffff', '#0c2340', '#2563eb', '#f97316'),
  p('lemon', 'Lemon', false, '#fffbea', '#fde68a', '#ffffff', '#3d2b00', '#b45309', '#65a30d'),
  p('mono', 'Monochrome', false, '#ffffff', '#eeeeee', '#f5f5f5', '#0a0a0a', '#0a0a0a', '#737373'),
  // Dark
  p('midnight', 'Midnight', true, '#0b1020', '#1a2240', '#141b33', '#e7ecff', '#6d8bff', '#f472b6'),
  p('charcoal-lime', 'Charcoal & lime', true, '#111111', '#1f1f1f', '#1a1a1a', '#f5f5f5', '#a3e635', '#22d3ee'),
  p('neon-night', 'Neon night', true, '#07070d', '#1a1033', '#120d22', '#f0eaff', '#d946ef', '#22d3ee'),
  p('deep-forest', 'Deep forest', true, '#0f1a14', '#1d3326', '#16261d', '#e8f3ea', '#4ade80', '#fbbf24'),
  p('espresso', 'Espresso', true, '#1c1410', '#3a2a20', '#2a1f18', '#f5e9dc', '#d4a373', '#e76f51'),
  p('ocean-deep', 'Ocean deep', true, '#061826', '#0b3550', '#0d2436', '#e0f2fe', '#38bdf8', '#fb923c'),
  p('wine', 'Wine', true, '#1a0b12', '#3d1426', '#2a0f1c', '#fbe7ef', '#f43f5e', '#fcd34d'),
  p('royal', 'Royal', true, '#10002b', '#240046', '#1c0638', '#f3e8ff', '#c77dff', '#ffd60a'),
]);

export const PALETTE_KEYS = ['bg', 'bg2', 'surface', 'text', 'primary', 'accent'];
export const PALETTE_LABELS = { bg: 'Background', bg2: 'Background 2', surface: 'Cards', text: 'Text', primary: 'Buttons', accent: 'Accent' };
export const MAX_CUSTOM_PALETTES = 24;

// ── color helpers ──
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const full = (hex) => {
  const h = String(hex).replace('#', '').toLowerCase();
  return `#${h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)}`;
};
const rgbOf = (hex) => { const h = full(hex).slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const toHex = (rgb) => `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
/** a → b by t (0..1). */
export const mixColors = (a, b, t) => { const x = rgbOf(a); const y = rgbOf(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = (hex) => {
  const c = rgbOf(hex).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
/** Readable text on a color: near-black or white. */
export const readableOn = (hex) => (contrast(hex, '#ffffff') >= contrast(hex, '#111111') ? '#ffffff' : '#111111');

function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
function hueOf(hex) {
  const [r, g, b] = rgbOf(hex).map((v) => v / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const d = max - min;
  if (!d) return { h: 0, s: 0 };
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = Math.round(h * 60); if (h < 0) h += 360;
  const l = (max + min) / 2;
  return { h, s: Math.round((d / (1 - Math.abs(2 * l - 1))) * 100) };
}

/** Clean a palette sent by the dashboard: { id?, name, colors }. */
export function sanitizePalette(input = {}) {
  const colors = {};
  for (const k of PALETTE_KEYS) {
    const v = String(input?.colors?.[k] || '').trim();
    if (HEX.test(v)) colors[k] = full(v);
  }
  if (!colors.bg || !colors.text || !colors.primary) return null;
  colors.bg2 ||= mixColors(colors.bg, colors.text, 0.08);
  colors.surface ||= mixColors(colors.bg, '#ffffff', 0.6);
  colors.accent ||= colors.primary;
  const name = String(input?.name || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 40) || 'My palette';
  const id = String(input?.id || '').replace(/[^\w-]/g, '').slice(0, 40) || `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return { id, name, colors, dark: lum(colors.bg) < 0.2 };
}

export function sanitizePaletteList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.map(sanitizePalette).filter((x) => x && !seen.has(x.id) && seen.add(x.id)).slice(0, MAX_CUSTOM_PALETTES);
}

/** A palette made from one color. mode: 'light' | 'dark'. */
export function paletteFromColor(hex, mode = 'light') {
  const base = HEX.test(String(hex)) ? full(hex) : '#7c3aed';
  const { h, s } = hueOf(base);
  const sat = Math.max(20, Math.min(s, 90));
  const accentHue = (h + 200) % 360;
  const colors = mode === 'dark'
    ? { bg: hsl(h, Math.min(sat, 35), 8), bg2: hsl(h, Math.min(sat, 40), 17), surface: hsl(h, Math.min(sat, 30), 13), text: hsl(h, 25, 94), primary: lum(base) < 0.12 ? hsl(h, sat, 62) : base, accent: hsl(accentHue, 80, 62) }
    : { bg: hsl(h, Math.min(sat, 45), 97), bg2: hsl(h, Math.min(sat, 55), 88), surface: '#ffffff', text: hsl(h, Math.min(sat, 40), 13), primary: lum(base) > 0.6 ? hsl(h, sat, 40) : base, accent: hsl(accentHue, 75, 45) };
  return { id: `from-${base.slice(1)}-${mode}`, name: `From ${base}`, colors, dark: mode === 'dark' };
}

// Button styles drawn with an ink outline / ink shadow (the text color), not the button color.
const INK_OUTLINE = new Set(['hard-shadow', 'cel', 'pop', 'sticker']);

/**
 * Recolor a design with a palette (an id or { colors }). Keeps fonts, button
 * shapes, sizes and the background type; only colors change.
 */
export function applyPalette(design = {}, palette) {
  const pal = typeof palette === 'string' ? palettes.get(palette) : palette;
  if (!pal?.colors) return design;
  const c = { ...pal.colors };
  c.bg2 ||= c.bg; c.surface ||= c.bg; c.accent ||= c.primary;
  const muted = mixColors(c.text, c.bg, 0.28);
  const style = design.buttonStyle;
  const glassy = style === 'glass';
  const w = { ...(design.wallpaper || { type: 'solid' }) };
  switch (w.type) {
    case 'gradient': w.from = c.bg; w.to = c.bg2; if (w.via && w.via !== 'transparent') w.via = mixColors(c.bg, c.bg2, 0.5); break;
    case 'pattern': w.bg = c.bg; w.fg = c.bg2; break;
    case 'grain': w.from = c.bg2; w.to = c.bg; break;
    case 'aurora': w.bg = c.bg; w.c1 = c.primary; w.c2 = c.accent; w.c3 = c.bg2; break;
    case 'image': case 'video': w.color = c.bg; if (w.overlay) w.overlay = c.bg; break;
    default: w.color = c.bg;
  }
  const surfaceAlpha = /^#[0-9a-f]{8}$/i.test(design.surfaceColor || '') ? design.surfaceColor.slice(7) : '';
  return {
    ...design,
    wallpaper: w,
    titleColor: c.text,
    textColor: muted,
    socialsColor: c.text,
    buttonColor: glassy ? (lum(c.bg) < 0.2 ? '#ffffff' : c.primary) : c.primary,
    buttonTextColor: glassy ? (lum(c.bg) < 0.2 ? '#ffffff' : c.text) : readableOn(c.primary),
    buttonBorderColor: style === 'gradient' ? c.accent : INK_OUTLINE.has(style) || style === 'double' ? (style === 'double' ? c.primary : c.text) : mixColors(c.primary, c.text, 0.25),
    buttonShadowColor: INK_OUTLINE.has(style) ? c.text : `${mixColors(c.primary, '#000000', 0.3)}55`,
    surfaceColor: c.surface + surfaceAlpha,
    surfaceTextColor: readableFor(c.text, c.surface),
    accentColor: c.accent,
    accentTextColor: readableOn(c.accent),
    avatarBorderColor: c.accent,
    palette: pal.id || 'custom',
  };
}

/** The palette text if it reads well on `bg`, otherwise black or white. */
const readableFor = (text, bg) => (contrast(text, bg) >= 4.5 ? text : readableOn(bg));

/** Preview colors of a palette: [bg, bg2, surface, text, primary, accent]. */
export const paletteSwatches = (pal) => PALETTE_KEYS.map((k) => pal.colors[k]);
