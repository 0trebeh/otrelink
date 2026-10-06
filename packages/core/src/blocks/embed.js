// Embed block: paste an embed code (an <iframe> from YouTube, Spotify, Google
// Forms, Calendly…, or a provider snippet with <script>). Shown always or behind
// a button that opens it.
//
// Safety: the pasted HTML never goes into the page directly.
//  • A single <iframe> is rebuilt from its allowed attributes (https src only).
//  • Anything else runs inside a sandboxed iframe (srcdoc, no same-origin), so
//    scripts can't touch the page, its storage or other visitors' data.
import { esc } from '../util/html.js';
import { toggleButton } from './_shared.js';

const SANDBOX = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation';
const IFRAME_RE = /^\s*<iframe\b([^>]*)>\s*(?:<\/iframe>)?\s*$/i;

/** Parse attributes of a tag: { name: value } (lower-case names). */
function attrsOf(s) {
  const out = {};
  for (const m of s.matchAll(/([a-zA-Z_:][-\w:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return out;
}
const decode = (v) => String(v).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/**
 * Understand an embed code.
 * → { kind: 'iframe', src, allow, title, width, height } | { kind: 'html', html } | { kind: 'url', src } | null
 */
export function parseEmbed(code) {
  const c = String(code || '').trim();
  if (!c) return null;
  // A bare https URL: embed it directly.
  if (/^https:\/\/\S+$/i.test(c)) return { kind: 'iframe', src: c, allow: '', title: '', width: 0, height: 0 };
  const m = c.match(IFRAME_RE);
  if (m) {
    const a = attrsOf(m[1]);
    const src = decode(a.src || '').trim();
    if (!/^https:\/\//i.test(src)) return null;
    const num = (v) => (/^\d+(px)?$/.test(String(v || '').trim()) ? parseInt(v, 10) : 0);
    return {
      kind: 'iframe', src,
      allow: decode(a.allow || '').replace(/[^\w\s;:=*'.\-/]/g, '').slice(0, 300),
      title: decode(a.title || '').slice(0, 120),
      width: num(a.width), height: num(a.height),
    };
  }
  return { kind: 'html', html: c };
}

/** The sandboxed document for embed snippets. It reports its height to the page. */
function sandboxDoc(html, id) {
  const key = JSON.stringify(String(id)).replace(/</g, '\\u003c');
  // color-scheme + darkreader-lock: the browser's dark mode (and Dark Reader) leave the widget's own colors alone.
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<meta name="color-scheme" content="only light"><meta name="darkreader-lock">'
    + '<base target="_blank"><style>html{color-scheme:only light}html,body{margin:0;padding:0;background:transparent;overflow:hidden}body>*{max-width:100%}</style></head><body>'
    + html
    + `<script>(function(){var k=${key},l=0;function s(){var h=Math.ceil(document.documentElement.getBoundingClientRect().height);if(h&&h!==l){l=h;parent.postMessage({olEmbed:k,h:h},'*')}}`
    + 'if(window.ResizeObserver)new ResizeObserver(s).observe(document.documentElement);addEventListener("load",s);setInterval(s,1000);s()})()</script></body></html>';
}

export default {
  type: 'embed',
  label: 'Embed',
  description: 'Paste an embed code (YouTube, Spotify, Calendly, Google Forms, a widget…). Always visible or behind a button.',
  icon: 'embed',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-embed', description: 'Wrapper of the embedded content' },
    { selector: '.ol-embed iframe', description: 'The embed frame' },
    { selector: '.ol-toggle', description: 'Wrapper in “Button that opens it” mode (details, [open] when expanded)' },
  ],
  fields: [
    { key: 'code', type: 'embed', label: 'Embed code', required: true,
      placeholder: '<iframe src="https://…"></iframe>',
      help: 'Paste the embed code (usually “Share → Embed”), or just an https link that can be embedded.' },
    { key: 'title', type: 'text', label: 'Title (optional)', help: 'Shown above the embed and read by screen readers.' },
    { key: 'height', type: 'range', label: 'Height (0 = automatic)', min: 0, max: 1200, step: 20, default: 0, unit: 'px',
      help: 'Automatic: uses the size from the code, or adjusts to the content.' },
    { key: 'display', type: 'choice', label: 'Show as', default: 'always', options: [
      { value: 'always', label: 'Always visible' }, { value: 'button', label: 'Button that opens it' },
    ] },
    { key: 'buttonLabel', type: 'text', label: 'Button text', placeholder: 'Defaults to the title or “Open”', showIf: { key: 'display', equals: 'button' } },
    { key: 'buttonSub', type: 'text', label: 'Button subtitle (optional)', showIf: { key: 'display', equals: 'button' } },
    { key: 'startOpen', type: 'toggle', label: 'Start open', default: false, showIf: { key: 'display', equals: 'button' } },
  ],
  summary: (d) => {
    const e = parseEmbed(d.code);
    const what = !e ? 'No valid embed code yet' : e.kind === 'iframe' ? (() => { try { return new URL(e.src).hostname.replace(/^www\./, ''); } catch { return 'iframe'; } })() : 'Embed code';
    return `${d.display === 'button' ? 'Button · ' : ''}${what}`;
  },
  render(d, ctx) {
    const e = parseEmbed(d.code);
    if (!e) return ctx.mode === 'preview' ? '<p class="ol-embed-title">Paste a valid embed code (an https iframe or a provider snippet).</p>' : '';
    const title = d.title || e.title || 'Embedded content';
    let frameHtml;
    if (e.kind === 'iframe') {
      // Your height wins; otherwise keep the ratio from the code when it gives
      // width and height in pixels (videos), or its height (e.g. width="100%").
      const size = d.height ? `height:${d.height}px`
        : e.width && e.height ? `aspect-ratio:${e.width} / ${e.height}`
          : e.height ? `height:${e.height}px` : 'height:400px';
      frameHtml = `<div class="ol-frame ol-embed" style="${size}"><iframe src="${esc(e.src)}" title="${esc(title)}" loading="lazy"`
        + `${e.allow ? ` allow="${esc(e.allow)}"` : ''} allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    } else {
      const fixed = d.height ? `height:${d.height}px` : 'height:160px';
      frameHtml = `<div class="ol-frame ol-embed ol-embed-code" style="${fixed}"${d.height ? '' : ' data-auto="1"'}>`
        + `<iframe sandbox="${SANDBOX}" srcdoc="${esc(sandboxDoc(e.html, ctx.blockId))}" title="${esc(title)}" loading="lazy" allow="autoplay; encrypted-media; fullscreen; clipboard-write; picture-in-picture"></iframe></div>`;
    }
    if (d.display === 'button') {
      return toggleButton({ ctx, iconName: 'embed', label: d.buttonLabel || d.title || 'Open', sub: d.buttonSub, body: frameHtml, open: d.startOpen });
    }
    return `${d.title ? `<p class="ol-embed-title">${esc(d.title)}</p>` : ''}${frameHtml}`;
  },
  // Auto height for snippets: the sandboxed document posts its height.
  hydrate(el, _data, ctx) {
    const box = el.querySelector('.ol-embed-code[data-auto]');
    const frame = box?.querySelector('iframe');
    if (!frame) return;
    const win = el.ownerDocument.defaultView;
    win.addEventListener('message', (e) => {
      if (e.source !== frame.contentWindow || !e.data || typeof e.data.h !== 'number') return;
      box.style.height = `${Math.min(3000, Math.max(60, Math.round(e.data.h)))}px`;
    });
  },
  css: '.ol-root .ol-embed-code{background:transparent;transition:height .15s}',
};
