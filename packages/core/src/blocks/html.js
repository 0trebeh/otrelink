// HTML block (Pro): paste HTML, CSS and JavaScript and it runs inside the block.
//
// Safety: the code runs in a sandboxed iframe without same-origin (like the
// Embed block). It can draw anything and run scripts, but it can't read the
// page, its cookies or storage, or other visitors' data (orders, loyalty
// cards…), and it can't change the rest of the page. The frame grows with its
// content. Optionally it gets the page fonts and colors as CSS variables.
import { esc } from '../util/html.js';
import { googleFontsHref } from '../fonts.js';
import { designCss, colorSchemeOf } from '../design.js';

const SANDBOX = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-presentation allow-top-navigation-by-user-activation';

// Code inside <style> / <script> must not be able to close them early.
const safeCss = (s) => String(s || '').replace(/<\/style/gi, '<\\/style');
const safeJs = (s) => String(s || '').replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

/** The document that runs in the block. Reports its height to the page. */
export function htmlBlockDoc(d, { id = '', design = null } = {}) {
  const key = JSON.stringify(String(id)).replace(/</g, '\\u003c');
  const dark = design && colorSchemeOf(design) === 'dark';
  let pageStyle = '';
  if (d.usePageStyle && design) {
    const fonts = googleFontsHref([design.titleFont, design.bodyFont]);
    // The page variables (--ol-text-color, --ol-btn-bg, --ol-title-font…) on :root.
    pageStyle = (fonts ? `<link rel="stylesheet" href="${esc(fonts)}">` : '')
      + `<style>${designCss(design).replace(/^\.ol-root\{/, ':root{')}`
      + 'body{font-family:var(--ol-body-font);font-size:var(--ol-body-size);color:var(--ol-text-color);line-height:1.5}'
      + 'h1,h2,h3,h4,h5,h6{font-family:var(--ol-title-font);color:var(--ol-title-color)}a{color:inherit}</style>';
  }
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + `<meta name="color-scheme" content="${dark ? 'dark' : 'only light'}"><meta name="darkreader-lock"><base target="_blank">`
    + `<style>html{color-scheme:${dark ? 'dark' : 'only light'}}html,body{margin:0;padding:0;background:transparent}body{display:flow-root;overflow-x:hidden}img,video,iframe{max-width:100%}</style>`
    + pageStyle
    + (d.css ? `<style>${safeCss(d.css)}</style>` : '')
    + `</head><body>${d.html || ''}`
    + (d.js ? `<script>${safeJs(d.js)}\n</script>` : '')
    + `<script>(function(){var k=${key},l=0;function s(){var b=document.body,h=b?Math.ceil(b.getBoundingClientRect().height):0;if(h&&h!==l){l=h;parent.postMessage({olHtml:k,h:h},'*')}}`
    + 'if(window.ResizeObserver)new ResizeObserver(s).observe(document.body);addEventListener("load",s);setInterval(s,1000);s()})()</script></body></html>';
}

export default {
  type: 'html',
  label: 'HTML',
  description: 'Paste your own HTML, CSS and JavaScript. It runs inside the block.',
  icon: 'code',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-html', description: 'Box of the HTML block (.is-card with the card background)' },
    { selector: '.ol-html iframe', description: 'The frame your code runs in' },
  ],
  fields: [
    { key: 'html', type: 'source', label: 'HTML', max: 50000, required: true,
      default: '<div class="hello">\n  <h2>Hello!</h2>\n  <p>This block runs your own HTML, CSS and JavaScript.</p>\n  <button id="btn">Click me</button>\n  <p id="out"></p>\n</div>',
      help: 'Only what goes inside <body>. Scripts and styles can also go here.' },
    { key: 'css', type: 'source', label: 'CSS (optional)', max: 20000,
      default: '.hello { text-align: center; padding: 8px; }\nbutton {\n  font: inherit; border: 0; border-radius: var(--ol-btn-radius, 12px);\n  padding: 10px 18px; cursor: pointer;\n  background: var(--ol-btn-bg, #111); color: var(--ol-btn-fg, #fff);\n}' },
    { key: 'js', type: 'source', label: 'JavaScript (optional)', max: 30000,
      default: "let n = 0;\ndocument.getElementById('btn').addEventListener('click', () => {\n  n++;\n  document.getElementById('out').textContent = `Clicked ${n} time${n === 1 ? '' : 's'}`;\n});" },
    { key: 'title', type: 'text', label: 'Title (optional)', help: 'Shown above the block and read by screen readers.' },
    { key: 'usePageStyle', type: 'toggle', label: 'Use the page fonts and colors', default: true,
      help: 'Your code gets the page fonts and colors, and CSS variables like var(--ol-text-color), var(--ol-btn-bg) or var(--ol-title-font).' },
    { key: 'background', type: 'choice', label: 'Background', default: 'none', options: [
      { value: 'none', label: 'Transparent' }, { value: 'card', label: 'Card' },
    ] },
    { key: 'height', type: 'range', label: 'Height (0 = automatic)', min: 0, max: 1600, step: 20, default: 0, unit: 'px',
      help: 'Automatic: the block grows with its content.' },
  ],
  summary: (d) => {
    const parts = [d.html && 'HTML', d.css && 'CSS', d.js && 'JS'].filter(Boolean);
    return parts.length ? parts.join(' + ') : 'Empty';
  },
  render(d, ctx) {
    if (!String(d.html || '').trim() && !String(d.js || '').trim()) {
      return ctx.mode === 'preview' ? '<p class="ol-embed-title">Paste your HTML.</p>' : '';
    }
    const title = d.title || 'Custom content';
    const size = d.height ? `height:${d.height}px` : 'height:120px';
    return `${d.title ? `<p class="ol-embed-title">${esc(d.title)}</p>` : ''}`
      + `<div class="ol-html${d.background === 'card' ? ' is-card' : ''}" style="${size}"${d.height ? '' : ' data-auto="1"'}>`
      // Same color-scheme as the frame's document, so its transparent background stays transparent.
      + `<iframe style="color-scheme:${ctx.design && colorSchemeOf(ctx.design) === 'dark' ? 'dark' : 'light'}" sandbox="${SANDBOX}" srcdoc="${esc(htmlBlockDoc(d, { id: ctx.blockId, design: ctx.design }))}" title="${esc(title)}"`
      + ' allow="autoplay; encrypted-media; fullscreen; clipboard-write; picture-in-picture"></iframe></div>';
  },
  // Auto height: the frame posts the height of its content.
  hydrate(el) {
    const box = el.querySelector('.ol-html[data-auto]');
    const frame = box?.querySelector('iframe');
    if (!frame) return;
    const win = el.ownerDocument.defaultView;
    const pad = box.classList.contains('is-card') ? 32 : 0;
    const onMessage = (e) => {
      if (!el.isConnected) { win.removeEventListener('message', onMessage); return; }
      if (e.source !== frame.contentWindow || !e.data || typeof e.data.h !== 'number') return;
      box.style.height = `${Math.min(5000, Math.max(20, Math.round(e.data.h) + pad))}px`;
    };
    win.addEventListener('message', onMessage);
  },
  css: `.ol-root .ol-html{width:100%;transition:height .15s;border-radius:var(--ol-surface-radius);overflow:hidden}
.ol-root .ol-html iframe{width:100%;height:100%;border:0;display:block;background:transparent}
.ol-root .ol-html.is-card{background:var(--ol-surface);padding:16px}`,
};
