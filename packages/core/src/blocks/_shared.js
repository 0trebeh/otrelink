// Helpers shared by block renderers.
import { esc, safeUrl } from '../util/html.js';
import { icon } from '../icons.js';
import { socialIcon, socials } from '../socials.js';

/**
 * Standard button used by link-like blocks. Gets the page's button style.
 * Elements with data-ol-track are counted as clicks in analytics.
 */
export function button({ href, label, sub = '', thumb = '', iconName = '', newTab = true, ctx, download = '' }) {
  const url = safeUrl(href);
  const media = thumb
    ? `<img class="ol-btn-thumb" src="${esc(thumb)}" alt="" loading="lazy">`
    : iconName
      ? `<span class="ol-btn-icon">${socials.has(iconName) ? socialIcon(iconName, 20) : icon(iconName, 20)}</span>`
      : '';
  const inner = `${media}<span class="ol-btn-label"><span class="ol-btn-title">${esc(label)}</span>${sub ? `<span class="ol-btn-sub">${esc(sub)}</span>` : ''}</span>${media ? '<span class="ol-btn-spacer"></span>' : ''}`;
  if (!url) return `<div class="ol-btn ol-btn-disabled">${inner}</div>`;
  const target = newTab && /^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
  const dl = download ? ` download="${esc(download)}"` : '';
  return `<a class="ol-btn${media ? ' has-media' : ''}" href="${esc(url)}"${target}${dl} data-ol-track="${esc(ctx.blockId)}">${inner}</a>`;
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
