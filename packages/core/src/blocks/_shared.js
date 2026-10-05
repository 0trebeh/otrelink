// Helpers shared by block renderers.
import { esc, safeUrl } from '../util/html.js';
import { adjustedImg, imgStyle } from '../util/image.js';
import { icon } from '../icons.js';
import { socialIcon, socials } from '../socials.js';

/**
 * Standard button used by link-like blocks. Gets the page's button style.
 * Elements with data-ol-track are counted as clicks in analytics.
 */
export function button({ href, label, sub = '', thumb = '', thumbAdjust, iconName = '', newTab = true, ctx, download = '' }) {
  const url = safeUrl(href);
  const media = thumb
    ? adjustedImg({ src: thumb, cls: 'ol-btn-thumb', adj: thumbAdjust, attrs: 'loading="lazy"' })
    : iconName
      ? `<span class="ol-btn-icon">${socials.has(iconName) ? socialIcon(iconName, 20) : icon(iconName, 20)}</span>`
      : '';
  const inner = `${media}<span class="ol-btn-label"><span class="ol-btn-title">${esc(label)}</span>${sub ? `<span class="ol-btn-sub">${esc(sub)}</span>` : ''}</span>${media ? '<span class="ol-btn-spacer"></span>' : ''}`;
  if (!url) return `<div class="ol-btn ol-btn-disabled">${inner}</div>`;
  const target = newTab && /^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
  const dl = download ? ` download="${esc(download)}"` : '';
  return `<a class="ol-btn${media ? ' has-media' : ''}" href="${esc(url)}"${target}${dl} data-ol-track="${esc(ctx.blockId)}">${inner}</a>`;
}

/**
 * A button that opens/closes content (details/summary). Used by blocks with a
 * "Button that opens it" display (Embed, Map…). The content is rendered once.
 */
export function toggleButton({ ctx, iconName, label, sub = '', body, open = false, cls = '' }) {
  return `<details class="ol-toggle${cls ? ` ${cls}` : ''}"${open ? ' open' : ''}>`
    + `<summary class="ol-btn has-media" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-icon">${icon(iconName, 20)}</span>`
    + `<span class="ol-btn-label"><span class="ol-btn-title">${esc(label)}</span>${sub ? `<span class="ol-btn-sub">${esc(sub)}</span>` : ''}</span>`
    + `<span class="ol-btn-icon ol-toggle-chevron">${icon('chevron', 18)}</span></summary>`
    + `<div class="ol-toggle-body">${body}</div></details>`;
}

/** Options for an "icon" select: none + generic icons + social platforms. */
export const iconOptions = () => [
  { value: '', label: 'None' },
  ...socials.list().map((s) => ({ value: s.id, label: s.label })),
];

/** Responsive 16:9 (or custom) iframe wrapper. */
export function frame(src, { ratio = '16 / 9', height = 0, title = 'Embedded content', allow = '' } = {}) {
  const style = height ? `height:${height}px` : `aspect-ratio:${ratio}`;
  return `<div class="ol-frame" style="${style}"><iframe src="${esc(src)}" title="${esc(title)}" loading="lazy" allow="${esc(allow)}" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}

/**
 * Link shown as a card with a cover image. Used when a Link block lives inside
 * a Collection with the Grid / Carousel ("card") or Showcase ("show") layout.
 */
export function linkCard({ url, title, subtitle, image, adjust }, variant, ctx) {
  const href = safeUrl(url);
  const img = safeUrl(image);
  const media = img
    ? `<span class="ol-col-media"><img src="${esc(img)}" alt="" loading="lazy"${imgStyle(adjust) ? ` style="${imgStyle(adjust)}"` : ''}></span>`
    : `<span class="ol-col-media ol-col-noimg" aria-hidden="true">${esc((title || '?').trim().charAt(0).toUpperCase())}</span>`;
  const text = `<span class="ol-col-text"><strong>${esc(title)}</strong>${subtitle ? `<small>${esc(subtitle)}</small>` : ''}</span>`;
  const cls = variant === 'show' ? 'ol-col-show' : 'ol-col-card';
  return href
    ? `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${media}${text}</a>`
    : `<div class="${cls}">${media}${text}</div>`;
}
