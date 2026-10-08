// Design settings of a page (everything in the "Style" panel).
//
// Settings are declared as field groups. The dashboard renders one card per
// group automatically, and the API sanitizes with the same declaration.
//
// To add a customization option:
//   1. add a field to a group below (or a new group)
//   2. use it in `designCss()` (usually as a CSS variable)
// That's it — it shows up in the dashboard and is saved/validated.

import { buttonStyles, buttonHovers } from './buttons/index.js';
import { fonts } from './fonts.js';
import { entranceAnimations } from './animations.js';
import { wallpapers } from './wallpapers/index.js';
import { defaultsFor, sanitizeFields } from './fields.js';

export const designGroups = [
  {
    id: 'buttons',
    label: 'Buttons',
    fields: [
      { key: 'buttonStyle', type: 'choice', label: 'Style', default: 'fill', options: () => buttonStyles.list().map((s) => ({ value: s.id, label: s.label, preview: s.preview })) },
      { key: 'buttonRadius', type: 'range', label: 'Corner radius', min: 0, max: 40, default: 14, unit: 'px' },
      { key: 'buttonColor', type: 'color', label: 'Button color', default: '#111111' },
      { key: 'buttonTextColor', type: 'color', label: 'Button text', default: '#ffffff' },
      { key: 'buttonBorderColor', type: 'color', label: 'Border / accent color', default: '#111111' },
      { key: 'buttonBorderWidth', type: 'range', label: 'Border width', min: 0, max: 4, default: 0, unit: 'px' },
      { key: 'buttonShadowColor', type: 'color', label: 'Shadow color', default: '#00000040' },
      { key: 'buttonGlassOpacity', type: 'range', label: 'Glass opacity', min: 0, max: 100, step: 2, default: 22, unit: '%',
        showIf: { key: 'buttonStyle', equals: 'glass' }, help: 'How much of the button color covers the glass.' },
      { key: 'buttonGlassBlur', type: 'range', label: 'Glass blur', min: 0, max: 40, default: 14, unit: 'px',
        showIf: { key: 'buttonStyle', equals: 'glass' }, help: 'How blurred the background looks through the button.' },
      { key: 'buttonHeight', type: 'range', label: 'Height', min: 40, max: 80, default: 56, unit: 'px' },
      { key: 'buttonHover', type: 'select', label: 'Hover effect', default: 'lift', options: () => buttonHovers.options() },
      { key: 'buttonAlign', type: 'select', label: 'Text alignment', default: 'center', options: ['center', 'left'] },
      { key: 'buttonTransform', type: 'select', label: 'Text case', default: 'none', options: [
        { value: 'none', label: 'As typed' }, { value: 'uppercase', label: 'UPPERCASE' }, { value: 'lowercase', label: 'lowercase' },
      ] },
    ],
  },
  {
    id: 'typography',
    label: 'Typography',
    fields: [
      { key: 'titleFont', type: 'font', label: 'Title font', default: 'inter', options: () => fonts.options() },
      { key: 'bodyFont', type: 'font', label: 'Body font', default: 'inter', options: () => fonts.options() },
      { key: 'titleColor', type: 'color', label: 'Title color', default: '#111111' },
      { key: 'textColor', type: 'color', label: 'Text color', default: '#333333' },
      { key: 'titleSize', type: 'range', label: 'Title size', min: 16, max: 48, default: 24, unit: 'px' },
      { key: 'titleWeight', type: 'select', label: 'Title weight', default: '700', options: ['400', '500', '600', '700', '800'] },
      { key: 'bodySize', type: 'range', label: 'Body size', min: 12, max: 20, default: 15, unit: 'px' },
    ],
  },
  {
    id: 'header',
    label: 'Header',
    fields: [
      { key: 'headerLayout', type: 'choice', label: 'Layout', default: 'classic', options: [
        { value: 'classic', label: 'Classic' }, { value: 'hero', label: 'Hero' }, { value: 'left', label: 'Left aligned' },
      ] },
      { key: 'avatarShape', type: 'select', label: 'Avatar shape', default: 'circle', options: ['circle', 'rounded', 'square', 'hidden'] },
      { key: 'avatarSize', type: 'range', label: 'Avatar size', min: 48, max: 160, default: 96, unit: 'px' },
      { key: 'avatarBorderWidth', type: 'range', label: 'Avatar border', min: 0, max: 8, default: 0, unit: 'px' },
      { key: 'avatarBorderColor', type: 'color', label: 'Avatar border color', default: '#ffffff' },
      { key: 'socialsPosition', type: 'select', label: 'Social icons position', default: 'top', options: [
        { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'both', label: 'Top and bottom' },
      ] },
      { key: 'socialsStyle', type: 'select', label: 'Social icons style', default: 'plain', options: ['plain', 'filled', 'outline', 'brand'] },
      { key: 'socialsColor', type: 'color', label: 'Social icons color', default: '#111111' },
      { key: 'socialsSize', type: 'range', label: 'Social icons size', min: 16, max: 36, default: 24, unit: 'px' },
    ],
  },
  {
    id: 'surfaces',
    label: 'Cards & surfaces',
    help: 'Background used by text, FAQ, countdown and contact blocks.',
    fields: [
      { key: 'surfaceColor', type: 'color', label: 'Card color', default: '#ffffffcc' },
      { key: 'surfaceTextColor', type: 'color', label: 'Card text color', default: '#111111' },
      { key: 'surfaceRadius', type: 'range', label: 'Card radius', min: 0, max: 32, default: 16, unit: 'px' },
      { key: 'accentColor', type: 'color', label: 'Accent color', default: '', allowEmpty: true, emptyBadge: 'Auto', emptyText: 'Same as the card text',
        help: 'Buy / Order buttons in the catalog, event date badges and the selected calendar day. Empty = the card text color.' },
      { key: 'accentTextColor', type: 'color', label: 'Accent text color', default: '', allowEmpty: true, emptyBadge: 'Auto', emptyText: 'Same as the card color' },
    ],
  },
  {
    id: 'layout',
    label: 'Layout & motion',
    fields: [
      { key: 'maxWidth', type: 'range', label: 'Content width', min: 360, max: 760, step: 10, default: 580, unit: 'px' },
      { key: 'gap', type: 'range', label: 'Space between blocks', min: 4, max: 32, default: 14, unit: 'px' },
      { key: 'paddingTop', type: 'range', label: 'Top padding', min: 8, max: 140, step: 4, default: 48, unit: 'px' },
      { key: 'entrance', type: 'select', label: 'Entrance animation', default: 'fade-up', options: () => entranceAnimations.options() },
    ],
  },
  {
    id: 'advanced',
    label: 'Custom CSS',
    help: 'Advanced: extra CSS appended to your page. Everything is scoped under .ol-root.',
    fields: [{ key: 'customCss', type: 'code', label: 'CSS', default: '', placeholder: '.ol-root .ol-btn { letter-spacing: .05em; }' }],
  },
];

export const designFields = designGroups.flatMap((g) => g.fields);

export const DEFAULT_WALLPAPER = { type: 'solid', ...defaultsFor(wallpapers.get('solid').fields) };

export function defaultDesign() {
  return { theme: 'air', ...defaultsFor(designFields), wallpaper: { ...DEFAULT_WALLPAPER } };
}

export function sanitizeWallpaper(w = {}) {
  const mod = wallpapers.resolve(w.type);
  return { type: mod.id, ...sanitizeFields(mod.fields, w) };
}

/** Sanitize a design object; missing values are filled with defaults. */
export function sanitizeDesign(input = {}) {
  return {
    theme: typeof input.theme === 'string' ? input.theme.slice(0, 40) : 'custom',
    // Last color palette applied (dashboard → Theme → Color palettes), '' after manual color edits.
    palette: typeof input.palette === 'string' ? input.palette.replace(/[^\w-]/g, '').slice(0, 40) : '',
    ...sanitizeFields(designFields, input),
    wallpaper: sanitizeWallpaper(input.wallpaper),
  };
}

/** Fill missing keys (e.g. after adding a new design option) with defaults. */
export function resolveDesign(design = {}) {
  const base = defaultDesign();
  const wpType = design.wallpaper?.type && wallpapers.has(design.wallpaper.type) ? design.wallpaper.type : base.wallpaper.type;
  const wpDefaults = { type: wpType, ...defaultsFor(wallpapers.get(wpType).fields) };
  return { ...base, ...design, wallpaper: { ...wpDefaults, ...(design.wallpaper || {}), type: wpType } };
}

/** Glass button variables (opacity in %, blur in px). The edge is a bit stronger than the fill. */
export function glassVars(opacity, blur) {
  const a = Math.min(100, Math.max(0, Number(opacity)));
  const out = [];
  if (Number.isFinite(a)) out.push(`--ol-glass-alpha:${a}%`, `--ol-glass-edge:${Math.min(100, Math.round(a * 1.6 + 10))}%`);
  if (Number.isFinite(Number(blur))) out.push(`--ol-glass-blur:${Math.min(60, Math.max(0, Number(blur)))}px`);
  return out.length ? out.join(';') + ';' : '';
}

/** Design -> CSS custom properties on .ol-root */
export function designCss(d) {
  const font = (id) => fonts.resolve(id).stack;
  return `.ol-root{`
    + `--ol-btn-bg:${d.buttonColor};--ol-btn-fg:${d.buttonTextColor};--ol-btn-border:${d.buttonBorderColor};`
    + `--ol-btn-bw:${d.buttonBorderWidth}px;--ol-btn-shadow:${d.buttonShadowColor};--ol-btn-radius:${d.buttonRadius >= 40 ? 999 : d.buttonRadius}px;`
    + `--ol-btn-h:${d.buttonHeight}px;--ol-btn-align:${d.buttonAlign};--ol-btn-transform:${d.buttonTransform};`
    + glassVars(d.buttonGlassOpacity, d.buttonGlassBlur)
    + `--ol-title-font:${font(d.titleFont)};--ol-body-font:${font(d.bodyFont)};`
    + `--ol-title-color:${d.titleColor};--ol-text-color:${d.textColor};--ol-title-size:${d.titleSize}px;--ol-title-weight:${d.titleWeight};--ol-body-size:${d.bodySize}px;`
    + `--ol-avatar-size:${d.avatarSize}px;--ol-avatar-bw:${d.avatarBorderWidth}px;--ol-avatar-bc:${d.avatarBorderColor};`
    + `--ol-social-color:${d.socialsColor};--ol-social-size:${d.socialsSize}px;`
    + `--ol-surface:${d.surfaceColor};--ol-surface-fg:${d.surfaceTextColor};--ol-surface-radius:${d.surfaceRadius}px;`
    // Accent: only when set, so blocks fall back to their own card text color.
    + (d.accentColor ? `--ol-accent:${d.accentColor};` : '') + (d.accentTextColor ? `--ol-accent-fg:${d.accentTextColor};` : '')
    + `--ol-max-width:${d.maxWidth}px;--ol-gap:${d.gap}px;--ol-pad-top:${d.paddingTop}px;`
    + `color-scheme:${colorSchemeOf(d) === 'dark' ? 'dark' : 'only light'};`
    + `}`;
}

// ── Contrast helpers (used by the dashboard to warn about unreadable text) ──
function luminance(hex) {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length < 6) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const la = luminance(a), lb = luminance(b);
  if (la === null || lb === null) return 21;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Light or dark, from the colors chosen in the dashboard (light text on cards
 * means a dark design). Used for the page's color-scheme so the browser's
 * dark mode never repaints the page and form controls match the design.
 */
export function colorSchemeOf(d) {
  const text = luminance(d?.surfaceTextColor) ?? luminance(d?.textColor);
  return text !== null && text > 0.4 ? 'dark' : 'light';
}

/** Dominant color of a wallpaper (best effort), or null for images/videos. */
export function wallpaperBaseColor(w = {}) {
  if (w.type === 'image' || w.type === 'video') return null;
  return w.color || w.bg || w.from || null;
}

// ── CSS variables reference (used by the /docs page) ──────────────────────
// Every variable written by designCss() above. A unit test checks both stay in sync.
export const cssVariables = [
  { name: '--ol-btn-bg', setting: 'buttonColor', description: 'Button background (and accent for outline/neon styles).' },
  { name: '--ol-btn-fg', setting: 'buttonTextColor', description: 'Button text color.' },
  { name: '--ol-btn-border', setting: 'buttonBorderColor', description: 'Button border / secondary accent color.' },
  { name: '--ol-btn-bw', setting: 'buttonBorderWidth', description: 'Button border width.' },
  { name: '--ol-btn-shadow', setting: 'buttonShadowColor', description: 'Button shadow color.' },
  { name: '--ol-btn-radius', setting: 'buttonRadius', description: 'Button corner radius (999px = pill).' },
  { name: '--ol-glass-alpha', setting: 'buttonGlassOpacity', description: 'Glass buttons: how much color covers the glass (%).' },
  { name: '--ol-glass-edge', setting: 'buttonGlassOpacity', description: 'Glass buttons: border opacity (follows Glass opacity).' },
  { name: '--ol-glass-blur', setting: 'buttonGlassBlur', description: 'Glass buttons: background blur.' },
  { name: '--ol-btn-h', setting: 'buttonHeight', description: 'Minimum button height.' },
  { name: '--ol-btn-align', setting: 'buttonAlign', description: 'Button text alignment (center | left).' },
  { name: '--ol-btn-transform', setting: 'buttonTransform', description: 'Button text case (none | uppercase | lowercase).' },
  { name: '--ol-title-font', setting: 'titleFont', description: 'Font stack for the title and headers.' },
  { name: '--ol-body-font', setting: 'bodyFont', description: 'Font stack for everything else.' },
  { name: '--ol-title-color', setting: 'titleColor', description: 'Title and header color.' },
  { name: '--ol-text-color', setting: 'textColor', description: 'Body text color.' },
  { name: '--ol-title-size', setting: 'titleSize', description: 'Profile title font size.' },
  { name: '--ol-title-weight', setting: 'titleWeight', description: 'Title and header font weight.' },
  { name: '--ol-body-size', setting: 'bodySize', description: 'Base font size of the page.' },
  { name: '--ol-avatar-size', setting: 'avatarSize', description: 'Avatar width and height.' },
  { name: '--ol-avatar-bw', setting: 'avatarBorderWidth', description: 'Avatar border width.' },
  { name: '--ol-avatar-bc', setting: 'avatarBorderColor', description: 'Avatar border color.' },
  { name: '--ol-social-color', setting: 'socialsColor', description: 'Social icons color.' },
  { name: '--ol-social-size', setting: 'socialsSize', description: 'Social icons size.' },
  { name: '--ol-surface', setting: 'surfaceColor', description: 'Card background (text cards, FAQ, countdown…).' },
  { name: '--ol-surface-fg', setting: 'surfaceTextColor', description: 'Text color on cards.' },
  { name: '--ol-surface-radius', setting: 'surfaceRadius', description: 'Corner radius of cards, images and embeds.' },
  { name: '--ol-accent', setting: 'accentColor', description: 'Accent color: catalog Buy / Order buttons, event date badges, selected calendar day (falls back to the card text color).' },
  { name: '--ol-accent-fg', setting: 'accentTextColor', description: 'Text on the accent color (falls back to the card color).' },
  { name: '--ol-max-width', setting: 'maxWidth', description: 'Maximum width of the content column.' },
  { name: '--ol-gap', setting: 'gap', description: 'Space between blocks.' },
  { name: '--ol-pad-top', setting: 'paddingTop', description: 'Space above the profile.' },
];
