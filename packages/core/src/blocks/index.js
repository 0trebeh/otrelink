// ─────────────────────────────────────────────────────────────
//  BLOCK TYPES REGISTRY
//  Add a block type:    create a file in this folder, import it, add it to the list.
//  Remove a block type: delete it from the list (existing blocks of that type are
//                       simply hidden on public pages; nothing breaks).
//
//  A block module looks like:
//  {
//    type: 'my-block',            unique id stored in the database
//    label, description, icon,    shown in the dashboard "Add" modal
//    category: 'Essentials',      groups blocks in the "Add" modal
//    cssClasses?: [{ selector, description }]  documented on the /docs page
//    fields: [...],               settings (see ../fields.js) -> form + validation
//    summary(data) -> string,     one-line summary in the dashboard list
//    render(data, ctx) -> html,   ESCAPE user values with esc()/safeUrl()
//    css?: string,                included once if the block is used
//    hydrate?(el, data, ctx),     optional browser behavior (timers, buttons...)
//  }
// ─────────────────────────────────────────────────────────────

import { createRegistry } from '../util/registry.js';
import { attentionAnimations } from '../animations.js';
import { buttonStyles } from '../buttons/index.js';

import link from './link.js';
import header from './header.js';
import text from './text.js';
import image from './image.js';
import banner from './banner.js';
import gallery from './gallery.js';
import video from './video.js';
import music from './music.js';
import map from './map.js';
import contact from './contact.js';
import vcard from './vcard.js';
import faq from './faq.js';
import countdown from './countdown.js';
import divider from './divider.js';
import share from './share.js';
import pdf from './pdf.js';
import collection from './collection.js';
import booking from './booking.js';
import survey from './survey.js';
import reviews from './reviews.js';
import embed from './embed.js';
import catalog from './catalog.js';

export const blockTypes = createRegistry('blockTypes', [
  link,
  collection,
  header,
  text,
  image,
  banner,
  gallery,
  pdf,
  video,
  embed,
  music,
  map,
  contact,
  catalog,
  booking,
  survey,
  reviews,
  vcard,
  faq,
  countdown,
  divider,
  share,
], 'type');

/** Settings every block has, regardless of type (shown in an "Advanced" area). */
export const commonBlockFields = [
  { key: 'animation', type: 'select', label: 'Attention animation', default: 'none', options: () => attentionAnimations.options() },
  { key: 'showFrom', type: 'datetime', label: 'Show from', help: 'Leave empty to show right away.' },
  { key: 'showUntil', type: 'datetime', label: 'Hide after', help: 'Leave empty to never hide.' },
];

/**
 * Optional style of one block, on top of the page design (dashboard: block → "Style").
 * Empty values keep the page's style. Stored in block.options with the fields above.
 */
const pageDefault = (label = 'Same as the page') => ({ value: '', label });
export const blockStyleFields = [
  { key: 'stButtonStyle', type: 'select', label: 'Button style', default: '',
    options: () => [pageDefault(), ...buttonStyles.list().map((s) => ({ value: s.id, label: s.label }))] },
  { key: 'stButtonColor', type: 'color', label: 'Button color', default: '', allowEmpty: true },
  { key: 'stButtonTextColor', type: 'color', label: 'Button text', default: '', allowEmpty: true },
  { key: 'stButtonBorderColor', type: 'color', label: 'Border / accent color', default: '', allowEmpty: true },
  { key: 'stButtonShadowColor', type: 'color', label: 'Shadow color', default: '', allowEmpty: true },
  { key: 'stGlassOpacity', type: 'select', label: 'Glass opacity', default: '', showIf: { key: 'stButtonStyle', equals: 'glass' },
    options: [pageDefault(), ...[0, 10, 20, 30, 40, 50, 60, 70, 80].map((n) => ({ value: String(n), label: `${n}%` }))] },
  { key: 'stGlassBlur', type: 'select', label: 'Glass blur', default: '', showIf: { key: 'stButtonStyle', equals: 'glass' },
    options: [pageDefault(), ...[0, 4, 8, 12, 16, 24, 32].map((n) => ({ value: String(n), label: `${n}px` }))] },
  { key: 'stRadius', type: 'select', label: 'Corner radius', default: '',
    options: [pageDefault(), ...[0, 4, 8, 12, 16, 20, 24, 32].map((n) => ({ value: String(n), label: `${n}px` })), { value: '999', label: 'Pill' }] },
  { key: 'stSurfaceColor', type: 'color', label: 'Card color', default: '', allowEmpty: true, help: 'Text, FAQ, countdown, booking, catalog and other card blocks.' },
  { key: 'stSurfaceTextColor', type: 'color', label: 'Card text color', default: '', allowEmpty: true },
  { key: 'stTextColor', type: 'color', label: 'Text color', default: '', allowEmpty: true, help: 'Headers and text outside cards.' },
];

/** True when a block has any style of its own. */
export const hasBlockStyle = (options = {}) => blockStyleFields.some((f) => options[f.key] !== undefined && options[f.key] !== '');

/** CSS variables + button style id for a block with its own style. */
export function blockStyleOf(options = {}) {
  if (!hasBlockStyle(options)) return null;
  const vars = [];
  const add = (name, v) => { if (v !== undefined && v !== '') vars.push(`${name}:${v}`); };
  add('--ol-btn-bg', options.stButtonColor);
  add('--ol-btn-fg', options.stButtonTextColor);
  add('--ol-btn-border', options.stButtonBorderColor);
  add('--ol-btn-shadow', options.stButtonShadowColor);
  if (options.stRadius !== '' && options.stRadius !== undefined) {
    add('--ol-btn-radius', `${options.stRadius}px`);
    add('--ol-surface-radius', `${Math.min(Number(options.stRadius), 40)}px`);
  }
  if (options.stGlassOpacity !== '' && options.stGlassOpacity !== undefined) {
    const a = Number(options.stGlassOpacity);
    add('--ol-glass-alpha', `${a}%`);
    add('--ol-glass-edge', `${Math.min(100, Math.round(a * 1.6 + 10))}%`);
  }
  if (options.stGlassBlur !== '' && options.stGlassBlur !== undefined) add('--ol-glass-blur', `${options.stGlassBlur}px`);
  add('--ol-surface', options.stSurfaceColor);
  add('--ol-surface-fg', options.stSurfaceTextColor);
  if (options.stTextColor) { add('--ol-text-color', options.stTextColor); add('--ol-title-color', options.stTextColor); }
  const buttonStyle = buttonStyles.has(options.stButtonStyle) ? options.stButtonStyle : '';
  return { vars: vars.join(';'), buttonStyle };
}
