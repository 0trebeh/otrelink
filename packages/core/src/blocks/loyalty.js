// Loyalty card: visitors get a digital stamp card (kept in their browser) with
// a QR code. The owner scans it in the dashboard "Loyalty" tab to add stamps
// and give the reward. Stamps live on the server, so they can't be faked.
//
// Visitor storage (localStorage): ol-loyalty:<blockId> = { id, token }
import { esc } from '../util/html.js';
import { icon } from '../icons.js';

export const STAMP_ICONS = ['⭐', '☕', '🍔', '🌮', '🍕', '🌭', '🍦', '🧋', '🍩', '❤️', '✂️', '💅'];

/** QR content of a card ("OLCARD:K7Q2MX"). */
export const cardQrText = (code) => `OLCARD:${code}`;
/** Card code from what a scanner read (QR text or a typed code like "k7q-2mx"). */
export function parseCardCode(text) {
  const s = String(text || '').toUpperCase().replace(/^OLCARD:/, '').replace(/[\s-]/g, '');
  return /^[A-HJ-NP-Z2-9]{6}$/.test(s) ? s : '';
}
/** "K7Q2MX" -> "K7Q-2MX" */
export const formatCardCode = (code) => (code ? `${code.slice(0, 3)}-${code.slice(3)}` : '');

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

function stampsHtml(d, filled) {
  const goal = Number(d.stamps) || 8;
  const n = Math.min(filled, goal);
  return `<ol class="ol-loy-stamps" style="--ol-loy-cols:${goal <= 6 ? goal : Math.ceil(goal / 2)}" aria-label="${n} of ${goal} stamps">`
    + Array.from({ length: goal }, (_, i) => `<li class="${i < n ? 'is-on' : ''}"><span aria-hidden="true">${i < n ? esc(d.icon) : i === goal - 1 ? icon('gift', 16) : ''}</span></li>`).join('')
    + '</ol>';
}

export default {
  type: 'loyalty',
  label: 'Loyalty card',
  description: 'A digital stamp card with a QR code. Scan it from the Loyalty tab to add stamps.',
  icon: 'stamp',
  category: 'Business',
  cssClasses: [
    { selector: '.ol-loy', description: 'Loyalty card' },
    { selector: '.ol-loy-stamps', description: 'Stamps (li.is-on = stamped)' },
    { selector: '.ol-loy-qr', description: 'QR code' },
    { selector: '.ol-loy-code', description: 'Card code under the QR' },
    { selector: '.ol-loy-ready', description: 'Shown when the reward is ready' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Title', default: 'Loyalty card', max: 60 },
    { key: 'reward', type: 'text', label: 'Reward', default: 'A free meal', max: 80, required: true },
    { key: 'stamps', type: 'range', label: 'Stamps for the reward', min: 3, max: 20, default: 8 },
    { key: 'icon', type: 'select', label: 'Stamp', default: '⭐', options: STAMP_ICONS.map((e) => ({ value: e, label: e })) },
    { key: 'howTo', type: 'textarea', label: 'How it works', max: 300, default: 'Get a stamp with every purchase. Show this card when you pay.' },
    { key: 'askName', type: 'toggle', label: 'Ask for a name', default: true, help: 'Helps you find a card when a customer changes phone.' },
    { key: 'oneStampEvery', type: 'select', label: 'Warn about a second stamp within', default: '60', options: [
      { value: '0', label: 'Never' }, { value: '10', label: '10 minutes' }, { value: '60', label: '1 hour' }, { value: '720', label: '12 hours' }, { value: '1440', label: '1 day' },
    ], help: 'When you scan the same card again that soon, the dashboard asks before adding another stamp.' },
  ],
  summary: (d) => `${d.stamps} stamps · ${d.reward}`,
  render(d, ctx) {
    const head = `<div class="ol-loy-head"><span class="ol-loy-icon" aria-hidden="true">${esc(d.icon)}</span><div><p class="ol-loy-title">${esc(d.title)}</p>`
      + `<p class="ol-loy-reward">${esc(d.stamps)} × ${esc(d.icon)} = ${esc(d.reward)}</p></div></div>`;
    if (ctx.mode === 'export') {
      return `<div class="ol-loy">${head}${stampsHtml(d, 0)}${ctx.liveUrl ? `<a class="ol-loy-btn" href="${esc(ctx.liveUrl)}" target="_blank" rel="noopener">Get my card</a>` : ''}</div>`;
    }
    return `<div class="ol-loy" data-api="${esc(ctx.apiBase || '')}" data-page="${esc(ctx.page?.id || '')}" data-block="${esc(ctx.blockId)}" data-mode="${esc(ctx.mode)}">`
      + `${head}<div class="ol-loy-body">${stampsHtml(d, 0)}`
      + (d.howTo ? `<p class="ol-loy-how">${esc(d.howTo)}</p>` : '')
      + '<div class="ol-loy-action"></div></div></div>';
  },
  hydrate(el, d, ctx) {
    const box = el.querySelector('.ol-loy[data-block]');
    if (!box) return;
    const { api, page: pageId, block: blockId, mode } = box.dataset;
    const preview = mode === 'preview';
    const key = `ol-loyalty:${blockId}`;
    const body = box.querySelector('.ol-loy-body');
    let timer = null;
    let qrSvg = '';

    const intro = (error = '') => {
      body.innerHTML = `${stampsHtml(d, 0)}${d.howTo ? `<p class="ol-loy-how">${esc(d.howTo)}</p>` : ''}`
        + '<form class="ol-loy-form" novalidate>'
        + (d.askName ? '<input name="name" maxlength="60" autocomplete="name" placeholder="Your name" aria-label="Your name">' : '')
        + '<input name="website" tabindex="-1" autocomplete="off" class="ol-hp" aria-hidden="true">'
        + `<button type="submit" class="ol-loy-btn">${icon('stamp', 17)}Get my card</button>`
        + `<p class="ol-loy-error" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p></form>`;
      body.querySelector('form').addEventListener('submit', create);
    };

    const show = async (card) => {
      const goal = Number(d.stamps) || 8;
      const ready = card.stamps >= goal;
      if (!qrSvg) {
        try {
          const { default: qrcode } = await import('qrcode-generator');
          const qr = qrcode(0, 'M');
          qr.addData(cardQrText(card.code));
          qr.make();
          qrSvg = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
        } catch { qrSvg = ''; }
      }
      body.innerHTML = stampsHtml(d, card.stamps)
        + (ready
          ? `<p class="ol-loy-ready">${icon('gift', 18)}Your reward is ready! Show this card to get: ${esc(d.reward)}</p>`
          : `<p class="ol-loy-left">${goal - card.stamps === 1 ? '1 more stamp' : `${goal - card.stamps} more stamps`} for: ${esc(d.reward)}</p>`)
        + `<div class="ol-loy-card"><div class="ol-loy-qr" role="img" aria-label="QR code of your card">${qrSvg}</div>`
        + `<div><p class="ol-loy-code notranslate" translate="no">${esc(formatCardCode(card.code))}</p>`
        + `<p class="ol-loy-how">Show this code when you pay.${card.name ? ` · <span class="notranslate" translate="no">${esc(card.name)}</span>` : ''}</p>`
        + (card.rewards ? `<p class="ol-loy-how">${card.rewards === 1 ? '1 reward' : `${card.rewards} rewards`} earned</p>` : '')
        + '</div></div>';
    };

    async function load() {
      clearTimeout(timer);
      if (!el.isConnected) return;
      const mine = store.get(key);
      if (preview) {
        // The preview shows what a card looks like, without creating one.
        show({ code: 'K7Q2MX', stamps: Math.min(3, (Number(d.stamps) || 8) - 1), rewards: 0, name: '' });
        return;
      }
      if (!mine?.id) { intro(); return; }
      try {
        const res = await fetch(`${api}/api/public/loyalty/${encodeURIComponent(mine.id)}?token=${encodeURIComponent(mine.token)}`);
        if (res.status === 404) { store.set(key, null); intro(); return; }
        if (!res.ok) throw new Error();
        const { card } = await res.json();
        await show(card);
      } catch {
        if (!body.querySelector('.ol-loy-card')) intro('Your card could not be loaded. Check your connection.');
      }
      // Stamps appear without reloading while the card is on screen.
      timer = setTimeout(load, el.ownerDocument.hidden ? 60_000 : 10_000);
    }

    async function create(e) {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button');
      const err = form.querySelector('.ol-loy-error');
      btn.disabled = true;
      try {
        const res = await fetch(`${api}/api/public/loyalty`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ pageId, blockId, name: form.elements.name?.value.trim() || '', website: form.elements.website.value }),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(res.status === 429 ? 'Too many cards from this device. Try again later.' : 'Your card could not be created. Try again.');
        store.set(key, { id: out.card.id, token: out.token });
        await show(out.card);
        timer = setTimeout(load, 10_000);
      } catch (x) {
        err.textContent = x.message;
        err.hidden = false;
        btn.disabled = false;
      }
    }

    const onVisible = () => { if (!el.ownerDocument.hidden && store.get(key)?.id) load(); };
    el.ownerDocument.addEventListener('visibilitychange', onVisible);
    load();
  },
  css: `.ol-root .ol-loy{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:16px;text-align:left}
.ol-root .ol-loy-head{display:flex;align-items:center;gap:12px}
.ol-root .ol-loy-icon{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:color-mix(in srgb,var(--ol-surface-fg) 8%,transparent);flex:none}
.ol-root .ol-loy-title{margin:0;font-family:var(--ol-title-font);font-weight:800;font-size:1.1em}
.ol-root .ol-loy-reward{margin:2px 0 0;font-size:.85em;opacity:.8}
.ol-root .ol-loy-stamps{list-style:none;margin:14px 0 0;padding:0;display:grid;grid-template-columns:repeat(var(--ol-loy-cols),minmax(0,1fr));gap:8px}
.ol-root .ol-loy-stamps li{aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font-size:clamp(14px,5cqi,22px);border:2px dashed color-mix(in srgb,var(--ol-surface-fg) 25%,transparent);color:color-mix(in srgb,var(--ol-surface-fg) 40%,transparent)}
.ol-root .ol-loy-stamps li.is-on{border:2px solid var(--ol-surface-fg);background:color-mix(in srgb,var(--ol-surface-fg) 8%,transparent);animation:ol-loy-stamp .35s ease}
@keyframes ol-loy-stamp{from{transform:scale(1.4) rotate(-12deg);opacity:0}}
.ol-root .ol-loy{container-type:inline-size}
.ol-root .ol-loy-how{margin:10px 0 0;font-size:.82em;opacity:.75;white-space:pre-line}
.ol-root .ol-loy-left{margin:12px 0 0;font-weight:700;font-size:.92em}
.ol-root .ol-loy-ready{margin:12px 0 0;display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:#dcfce7;color:#14532d;font-weight:700;font-size:.92em}
.ol-root .ol-loy-card{display:flex;align-items:center;gap:14px;margin-top:12px;padding-top:12px;border-top:1px solid color-mix(in srgb,var(--ol-surface-fg) 12%,transparent)}
.ol-root .ol-loy-card .ol-loy-how{margin-top:2px}
.ol-root .ol-loy-qr{width:112px;height:112px;flex:none;background:#fff;border-radius:10px;padding:4px}
.ol-root .ol-loy-qr svg{width:100%;height:100%;display:block}
.ol-root .ol-loy-code{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800;font-size:1.35em;letter-spacing:.08em}
.ol-root .ol-loy-form{display:grid;gap:8px;margin-top:12px}
.ol-root .ol-loy-form input:not(.ol-hp){font:inherit;font-size:16px;padding:11px 12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--ol-surface-fg) 25%,transparent);background:transparent;color:inherit}
.ol-root .ol-loy-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;font:inherit;font-weight:700;border:0;border-radius:999px;padding:0 18px;cursor:pointer;text-decoration:none;background:var(--ol-surface-fg);color:var(--ol-surface)!important;margin-top:12px}
.ol-root .ol-loy-form .ol-loy-btn{margin-top:0}
.ol-root .ol-loy-btn:disabled{opacity:.6}
.ol-root .ol-loy-error{margin:0;color:#dc2626;font-size:.85em;font-weight:600}
.ol-root .ol-loy-error[hidden]{display:none}
.ol-root .ol-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}`,
};
