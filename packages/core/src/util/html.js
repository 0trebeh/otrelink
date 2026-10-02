// HTML helpers. Every renderer builds strings, so every value that comes
// from a user MUST go through esc() / attr() / safeUrl() before output.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

/** Escape text for HTML body or attribute context. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (c) => ESC[c]);
}

/** Build an attribute string from an object, skipping null/false values. */
export function attrs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('');
}

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'sms:'];

/**
 * Returns a safe URL or '' when the URL is not allowed.
 * Relative URLs ("/api/assets/…") are allowed. "javascript:", "data:" etc. are not.
 */
export function safeUrl(value, { allowRelative = true } = {}) {
  if (!value) return '';
  const url = String(value).trim();
  if (allowRelative && url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

/** Escape a string so it can be embedded in a CSS string literal / url(). */
export function cssString(value) {
  return String(value ?? '').replace(/["\\\n\r<>]/g, (c) => '\\' + c.charCodeAt(0).toString(16) + ' ');
}

/**
 * Tiny, safe markdown: **bold**, *italic*, ~~strike~~, [text](url) and line breaks.
 * Input is escaped first, so no raw HTML ever survives.
 */
export function miniMarkdown(text) {
  let out = esc(text);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const url = safeUrl(href.replace(/&amp;/g, '&'), { allowRelative: false });
    return url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  return out.replace(/\n/g, '<br>');
}

/** Short random id for blocks, socials, list items. */
export function uid(prefix = '') {
  const rnd = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${rnd}` : rnd;
}
