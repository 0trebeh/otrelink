// Copy block: a button that copies a text to the clipboard (a discount code,
// a wallet address, a bank account, an email…). Shows "Copied!" for a moment.
import { esc } from '../util/html.js';
import { icon } from '../icons.js';

/** Copy text, with a fallback for browsers or frames without the Clipboard API. */
export async function copyText(doc, text) {
  const win = doc.defaultView;
  try {
    await win.navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;user-select:text;-webkit-user-select:text';
    doc.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = doc.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export default {
  type: 'copy',
  label: 'Copy button',
  description: 'A button that copies a text: a code, an account number, an address…',
  icon: 'copy',
  category: 'Essentials',
  cssClasses: [
    { selector: '.ol-copybtn', description: 'The copy button (.is-copied right after copying)' },
    { selector: '.ol-copybtn-text', description: 'The text shown under the title (when “Show the text” is on)' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Button text', required: true, max: 100, default: 'Copy my code', placeholder: 'Copy discount code' },
    { key: 'text', type: 'textarea', label: 'Text to copy', required: true, max: 2000, placeholder: 'SAVE20' },
    { key: 'showText', type: 'toggle', label: 'Show the text on the button', default: true },
    { key: 'subtitle', type: 'text', label: 'Subtitle', max: 120, placeholder: 'Use it at checkout', showIf: { key: 'showText', equals: false } },
    { key: 'copiedLabel', type: 'text', label: 'Message after copying', default: 'Copied!', max: 40 },
  ],
  summary: (d) => (d.text ? `Copies “${d.text.length > 40 ? `${d.text.slice(0, 40)}…` : d.text}”` : 'No text yet'),
  render(d, ctx) {
    const sub = d.showText ? d.text : d.subtitle;
    return `<button type="button" class="ol-btn has-media ol-copybtn" data-copy="${esc(d.text)}" data-copied="${esc(d.copiedLabel || 'Copied!')}" data-ol-track="${esc(ctx.blockId)}">`
      + `<span class="ol-btn-icon ol-copybtn-icon">${icon('copy', 20)}</span>`
      + `<span class="ol-btn-label"><span class="ol-btn-title">${esc(d.title)}</span>`
      + (sub ? `<span class="ol-btn-sub${d.showText ? ' ol-copybtn-text' : ''}">${esc(sub)}</span>` : '')
      + '</span><span class="ol-btn-spacer"></span>'
      + '<span class="ol-copybtn-status" role="status" aria-live="polite"></span></button>';
  },
  hydrate(el) {
    const btn = el.querySelector('.ol-copybtn');
    if (!btn) return;
    const doc = el.ownerDocument;
    const title = btn.querySelector('.ol-btn-title');
    const ico = btn.querySelector('.ol-copybtn-icon');
    const status = btn.querySelector('.ol-copybtn-status');
    const original = { title: title.textContent, icon: ico.innerHTML };
    let timer;
    btn.addEventListener('click', async () => {
      const ok = await copyText(doc, btn.dataset.copy || '');
      clearTimeout(timer);
      btn.classList.toggle('is-copied', ok);
      title.textContent = ok ? btn.dataset.copied : 'Could not copy';
      ico.innerHTML = icon(ok ? 'check' : 'copy', 20);
      status.textContent = ok ? btn.dataset.copied : 'Could not copy';
      timer = setTimeout(() => {
        btn.classList.remove('is-copied');
        title.textContent = original.title;
        ico.innerHTML = original.icon;
        status.textContent = '';
      }, 1800);
    });
  },
  css: `.ol-root .ol-copybtn{-webkit-appearance:none;appearance:none;margin:0}
.ol-root .ol-copybtn-text{font-family:var(--ol-mono-font,ui-monospace,SFMono-Regular,Menlo,monospace);letter-spacing:.02em;white-space:pre-wrap;word-break:break-all}
.ol-root .ol-copybtn-status{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.ol-root .ol-copybtn.is-copied .ol-copybtn-icon{animation:ol-copied .35s ease}
@keyframes ol-copied{0%{transform:scale(.6)}70%{transform:scale(1.15)}100%{transform:none}}`,
};
