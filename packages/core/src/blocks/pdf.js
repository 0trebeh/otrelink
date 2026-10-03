// PDF document block. Pages are drawn with PDF.js (loaded from a CDN only when
// a page has a PDF), so it works on every browser, including Android Chrome,
// which can't show PDFs inside an <iframe>.
import { esc, safeUrl } from '../util/html.js';
import { icon } from '../icons.js';
import { button } from './_shared.js';

// Change the version/CDN here. Can also be overridden with globalThis.OTRELINK_PDFJS_BASE.
const PDFJS_BASE = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/';

let pdfjsPromise;
function loadPdfjs() {
  if (!pdfjsPromise) {
    const base = globalThis.OTRELINK_PDFJS_BASE || PDFJS_BASE;
    // new Function keeps bundlers (Vite / Next) from trying to bundle the CDN URL.
    const importUrl = new Function('u', 'return import(u)');
    pdfjsPromise = importUrl(`${base}pdf.min.mjs`).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`;
      return lib;
    }).catch((err) => { pdfjsPromise = null; throw err; });
  }
  return pdfjsPromise;
}

const downloadUrl = (url) => url + (url.includes('?') ? '&' : '?') + 'download=1';

export default {
  type: 'pdf',
  label: 'PDF',
  description: 'Show a PDF (menu, portfolio, CV…) right on your page.',
  icon: 'file',
  category: 'Media',
  cssClasses: [
    { selector: '.ol-pdf', description: 'Card with the viewer' },
    { selector: '.ol-pdf-head', description: 'Icon, title and description' },
    { selector: '.ol-pdf-pages', description: 'Scrollable area with the pages' },
    { selector: '.ol-pdf-page', description: 'One page (contains a canvas)' },
    { selector: '.ol-pdf-actions', description: 'Open / Download buttons' },
    { selector: '.ol-pdf-action', description: 'One action button' },
  ],
  fields: [
    { key: 'file', type: 'file', label: 'PDF file', accept: 'application/pdf', required: true, help: 'Up to 10 MB. You can also paste a link to a PDF.' },
    { key: 'title', type: 'text', label: 'Title', placeholder: 'Menu, Portfolio, CV…' },
    { key: 'description', type: 'text', label: 'Description (optional)' },
    { key: 'display', type: 'choice', label: 'Display', default: 'viewer', options: [
      { value: 'viewer', label: 'Show pages' }, { value: 'button', label: 'Button' },
    ] },
    { key: 'height', type: 'range', label: 'Viewer height', min: 280, max: 900, step: 20, default: 520, unit: 'px', showIf: { key: 'display', equals: 'viewer' } },
    { key: 'allowDownload', type: 'toggle', label: 'Show download button', default: true, help: 'Hiding it removes the button; visitors who open the PDF can still save it from their browser.' },
  ],
  summary: (d) => (!d.file ? 'No file yet' : d.display === 'button' ? 'PDF · button' : 'PDF · pages'),
  render(d, ctx) {
    const url = safeUrl(d.file);
    if (!url) return `<div class="ol-card ol-pdf ol-pdf-empty">${icon('file', 20)} Upload a PDF to show it here</div>`;
    const title = d.title || 'Document';
    const dl = d.allowDownload
      ? `<a class="ol-pdf-action ol-pdf-download" href="${esc(downloadUrl(url))}" data-ol-track="${esc(ctx.blockId)}">${icon('download', 16)} Download</a>`
      : '';
    if (d.display === 'button') {
      return button({ href: url, label: title, sub: d.description, iconName: 'file', ctx })
        + (dl ? `<div class="ol-pdf-actions ol-pdf-actions-solo">${dl}</div>` : '');
    }
    return `<div class="ol-card ol-pdf" data-src="${esc(url)}">`
      + `<div class="ol-pdf-head"><span class="ol-pdf-icon">${icon('file', 20)}</span><span><strong>${esc(title)}</strong>${d.description ? `<small>${esc(d.description)}</small>` : ''}</span><span class="ol-pdf-count"></span></div>`
      + `<div class="ol-pdf-pages" style="height:${d.height}px"><p class="ol-pdf-status">Loading PDF…</p></div>`
      + `<div class="ol-pdf-actions"><a class="ol-pdf-action" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${icon('external', 16)} Open</a>${dl}</div>`
      + '</div>';
  },
  async hydrate(el) {
    const box = el.querySelector('.ol-pdf[data-src]');
    if (!box) return;
    const doc = el.ownerDocument;
    const win = doc.defaultView;
    const pages = box.querySelector('.ol-pdf-pages');
    const status = box.querySelector('.ol-pdf-status');
    const src = box.dataset.src;
    try {
      const lib = await loadPdfjs();
      const pdf = await lib.getDocument({ url: src }).promise;
      if (!box.isConnected) return pdf.destroy();
      box.querySelector('.ol-pdf-count').textContent = `${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'}`;
      const first = await pdf.getPage(1);
      const vp1 = first.getViewport({ scale: 1 });
      status.remove();

      const render = async (wrap) => {
        if (wrap.dataset.done) return;
        wrap.dataset.done = '1';
        const page = await pdf.getPage(Number(wrap.dataset.page));
        const base = page.getViewport({ scale: 1 });
        const dpr = Math.min(win.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: (wrap.clientWidth * dpr) / base.width });
        const canvas = doc.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.setAttribute('aria-label', `Page ${wrap.dataset.page}`);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        wrap.append(canvas);
      };

      // Pages are drawn only when they scroll into view.
      const io = new win.IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); render(e.target).catch(() => {}); }
      }, { root: pages, rootMargin: '300px 0px' });

      for (let i = 1; i <= pdf.numPages; i++) {
        const wrap = doc.createElement('div');
        wrap.className = 'ol-pdf-page';
        wrap.dataset.page = String(i);
        wrap.style.aspectRatio = `${vp1.width} / ${vp1.height}`;
        pages.append(wrap);
        io.observe(wrap);
      }
    } catch (err) {
      console.warn('[otrelink] PDF could not be displayed', err);
      if (status) status.innerHTML = `This PDF can't be previewed here. <a href="${esc(src)}" target="_blank" rel="noopener noreferrer">Open it</a>.`;
    }
  },
  css: `.ol-root .ol-pdf{padding:12px;text-align:left}
.ol-root .ol-pdf-empty{display:flex;align-items:center;gap:8px;justify-content:center;opacity:.75}
.ol-root .ol-pdf-head{display:flex;align-items:center;gap:10px;margin:2px 2px 10px}
.ol-root .ol-pdf-head>span:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column}
.ol-root .ol-pdf-head small{opacity:.75;font-size:.85em}
.ol-root .ol-pdf-icon{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,var(--ol-surface-fg) 10%,transparent);flex-shrink:0}
.ol-root .ol-pdf-count{font-size:.8em;opacity:.7;white-space:nowrap}
.ol-root .ol-pdf-pages{overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:8px;border-radius:calc(var(--ol-surface-radius)*.6);background:color-mix(in srgb,var(--ol-surface-fg) 8%,transparent);-webkit-overflow-scrolling:touch}
.ol-root .ol-pdf-page{background:#fff;width:100%;flex-shrink:0;box-shadow:0 1px 4px rgba(0,0,0,.18)}
.ol-root .ol-pdf-page canvas{display:block;width:100%;height:auto}
.ol-root .ol-pdf-status{margin:auto;opacity:.75;font-size:.9em;text-align:center;padding:0 12px}
.ol-root .ol-pdf-status a{color:inherit}
.ol-root .ol-pdf-actions{display:flex;gap:8px;margin-top:10px}
.ol-root .ol-pdf-actions-solo{margin-top:calc(var(--ol-gap)*-.5)}
.ol-root .ol-pdf-action{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;padding:0 14px;border-radius:999px;font-weight:600;font-size:.9em;text-decoration:none;background:color-mix(in srgb,var(--ol-surface-fg) 9%,transparent);color:var(--ol-surface-fg)}
.ol-root .ol-pdf-action:hover{background:color-mix(in srgb,var(--ol-surface-fg) 15%,transparent)}
.ol-root .ol-pdf-download{background:transparent;border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 25%,transparent)}
.ol-root .ol-pdf-actions-solo .ol-pdf-action{color:var(--ol-text-color);border-color:color-mix(in srgb,var(--ol-text-color) 30%,transparent)}`,
};
