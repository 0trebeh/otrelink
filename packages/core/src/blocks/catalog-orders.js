// Pickup orders of the Catalog block (browser only): cart, order panel,
// sending the order and following its status. The server prices every order
// again from the block data (see priceCart in ./catalog.js).
//
// Visitor storage (localStorage):
//   ol-cart:<pageId>:<blockId>  the cart  [{ id, qty, extras: [index] }]
//   ol-orders:<pageId>          orders sent from this browser [{ id, token, code, blockId, at }]
import { esc } from '../util/html.js';
import { icon } from '../icons.js';
import { formatMoney, priceCart, parseExtras, salePrice, pickupTimes, orderText, waNumber, isSoldOut } from './catalog.js';
import { formatMinutes, pageLocale } from '../hours.js';

const STEPS = [
  { id: 'new', label: 'Received' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready for pickup' },
];
const ACTIVE = ['new', 'preparing', 'ready'];
const ERRORS = {
  sold_out: (e) => `Sorry, ${e.product || 'a product'} just sold out. It was removed from your order.`,
  paused: () => 'We’re not taking orders right now.',
  closed: () => 'We’re not taking orders right now.',
  missing_name: () => 'Write your name.',
  missing_phone: () => 'Write your phone number.',
  invalid_pickup: () => 'Choose a pickup time.',
  rate_limited: () => 'Too many orders from this device. Try again in a few minutes.',
};

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const toMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };

export function mountOrders(el, root, d, ctx) {
  const doc = el.ownerDocument;
  const { api, page: pageId, block: blockId, mode, lang } = root.dataset;
  const preview = mode === 'preview';
  const today = ctx.page?.today;
  const locale = pageLocale(ctx.page);
  const money = (n) => formatMoney(n, d);
  const host = el.closest('.ol-root') || doc.body;
  const cartKey = `ol-cart:${pageId}:${blockId}`;
  const ordersKey = `ol-orders:${pageId}`;
  const product = (id) => (d.products || []).find((p) => p.id === id && p.name);
  const wa = waNumber(d.whatsapp);

  // Cart: drop products that are gone or sold out since last time.
  let cart = (store.get(cartKey) || []).filter((l) => { const p = product(l?.id); return p && !isSoldOut(p, blockId, today) && l.qty > 0; });

  // ── "View order" bar ───────────────────────────────────────
  const bar = doc.createElement('div');
  bar.className = 'ol-cart-bar';
  bar.hidden = true;
  bar.innerHTML = `<button type="button" class="ol-cart-open">${icon('bag', 18)}<span class="ol-cart-n notranslate" translate="no"></span><span class="ol-cart-label">View order</span><span class="ol-cart-total notranslate" translate="no"></span></button>`;
  host.append(bar);

  // ── Panel (item options, cart + checkout, confirmation) ────
  const sheet = doc.createElement('div');
  sheet.className = 'ol-cart-sheet';
  sheet.hidden = true;
  host.append(sheet);
  let lastFocus = null;

  const priced = () => {
    const r = priceCart(d, cart, { blockId, today });
    return r.error ? { lines: [], total: 0 } : r;
  };
  const save = () => store.set(cartKey, cart.length ? cart : null);
  const count = () => cart.reduce((s, l) => s + l.qty, 0);

  function refresh() {
    const n = count();
    bar.hidden = !n || !sheet.hidden;
    bar.querySelector('.ol-cart-n').textContent = String(n);
    bar.querySelector('.ol-cart-total').textContent = money(priced().total);
    // Units of each product on its "Add" button.
    root.querySelectorAll('[data-add]').forEach((b) => {
      const q = cart.filter((l) => l.id === b.dataset.add).reduce((s, l) => s + l.qty, 0);
      const badge = b.querySelector('.ol-cat-count');
      if (badge) { badge.hidden = !q; badge.textContent = String(q); }
    });
  }

  function add(id, extras, qty) {
    const key = [...extras].sort((a, b) => a - b).join(',');
    const same = cart.find((l) => l.id === id && [...(l.extras || [])].sort((a, b) => a - b).join(',') === key);
    if (same) same.qty = Math.min(50, same.qty + qty);
    else cart.push({ id, qty, extras: [...extras].sort((a, b) => a - b) });
    save();
    refresh();
  }

  function open(html, label) {
    lastFocus = doc.activeElement;
    sheet.innerHTML = `<div class="ol-cart-back" data-close></div><div class="ol-cart-panel" role="dialog" aria-modal="true" aria-label="${esc(label)}">`
      + `<button type="button" class="ol-cart-x" data-close aria-label="Close">×</button>${html}</div>`;
    sheet.hidden = false;
    bar.hidden = true;
    doc.documentElement.classList.add('ol-cart-lock');
    (sheet.querySelector('[autofocus]') || sheet.querySelector('.ol-cart-panel button:not(.ol-cart-x), .ol-cart-panel input'))?.focus?.({ preventScroll: true });
  }
  function close() {
    sheet.hidden = true;
    sheet.innerHTML = '';
    doc.documentElement.classList.remove('ol-cart-lock');
    refresh();
    lastFocus?.focus?.({ preventScroll: true });
  }

  const stepper = (qty, attr = '') => `<span class="ol-qty"${attr}><button type="button" data-qty="-1" aria-label="One less">${icon('minus', 14)}</button>`
    + `<span class="ol-qty-n notranslate" translate="no" aria-live="polite">${qty}</span><button type="button" data-qty="1" aria-label="One more">${icon('plus', 14)}</button></span>`;

  // Product with extras: pick them first.
  function openItem(p) {
    const extras = parseExtras(p.extras);
    const base = Number(p.discount) > 0 ? salePrice(p) : Number(p.price || 0);
    let qty = 1;
    open(`<p class="ol-cart-h">${esc(p.name)}</p>${p.description ? `<p class="ol-cart-sub">${esc(p.description)}</p>` : ''}`
      + `<fieldset class="ol-cart-extras"><legend>Extras</legend>${extras.map((e, i) => `<label class="ol-cart-check"><input type="checkbox" value="${i}"><span>${esc(e.name)}</span>${e.price ? `<span class="ol-cart-plus notranslate" translate="no">+${esc(money(e.price))}</span>` : ''}</label>`).join('')}</fieldset>`
      + `<div class="ol-cart-row">${stepper(1)}<button type="button" class="ol-cart-main" data-confirm><span>${esc(d.addLabel || 'Add')}</span><span class="ol-cart-sum notranslate" translate="no"></span></button></div>`, p.name);
    const panel = sheet.querySelector('.ol-cart-panel');
    const picked = () => [...panel.querySelectorAll('input[type=checkbox]:checked')].map((x) => Number(x.value));
    const update = () => {
      const unit = base + picked().reduce((s, i) => s + extras[i].price, 0);
      panel.querySelector('.ol-qty-n').textContent = String(qty);
      panel.querySelector('.ol-cart-sum').textContent = unit > 0 ? money(unit * qty) : '';
    };
    panel.addEventListener('change', update);
    panel.addEventListener('click', (e) => {
      const q = e.target.closest('[data-qty]');
      if (q) { qty = Math.min(50, Math.max(1, qty + Number(q.dataset.qty))); update(); }
      if (e.target.closest('[data-confirm]')) { add(p.id, picked(), qty); close(); }
    });
    update();
  }

  // The cart and the checkout form.
  function openCart(error = '') {
    const r = priced();
    if (!r.lines.length) { close(); return; }
    const times = d.pickupLater ? pickupTimes(d) : [];
    const lines = r.lines.map((l, i) => `<li class="ol-cart-line" data-i="${i}"><div class="ol-cart-lname"><span>${esc(l.name)}</span>`
      + `${l.extras.length ? `<small>${esc(l.extras.map((e) => e.name).join(', '))}</small>` : ''}</div>`
      + `${stepper(l.qty, ` data-line="${i}"`)}<span class="ol-cart-ltotal notranslate" translate="no">${l.total > 0 ? esc(money(l.total)) : ''}</span></li>`).join('');
    open(`<p class="ol-cart-h">Your order</p><ul class="ol-cart-lines">${lines}</ul>`
      + `<p class="ol-cart-totalrow"><span>Total</span><strong class="notranslate" translate="no">${esc(money(r.total))}</strong></p>`
      + `<form class="ol-cart-form" novalidate>`
      + `<label class="ol-cart-field"><span>Your name</span><input name="name" autocomplete="name" maxlength="60" required></label>`
      + (d.askPhone ? `<label class="ol-cart-field"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" maxlength="32" required></label>` : '')
      + (times.length ? `<label class="ol-cart-field"><span>Pickup</span><select name="pickup"><option value="asap">As soon as possible</option>${times.map((t) => `<option value="${t}">${esc(formatMinutes(toMin(t), locale))}</option>`).join('')}</select></label>` : '')
      + (d.allowNotes ? `<label class="ol-cart-field"><span>Note (optional)</span><textarea name="note" rows="2" maxlength="300"></textarea></label>` : '')
      + '<input name="website" tabindex="-1" autocomplete="off" class="ol-hp" aria-hidden="true">'
      + `<p class="ol-cart-error" role="alert"${error ? '' : ' hidden'}>${esc(error)}</p>`
      + `<button type="submit" class="ol-cart-main"><span>Place order</span><span class="notranslate" translate="no">${esc(money(r.total))}</span></button>`
      + '</form>', 'Your order');
    const panel = sheet.querySelector('.ol-cart-panel');
    // Remember what the visitor typed (name, phone) for next time.
    const me = store.get('ol-me') || {};
    const form = panel.querySelector('form');
    if (me.name) form.elements.name.value = me.name;
    if (me.phone && form.elements.phone) form.elements.phone.value = me.phone;
    panel.addEventListener('click', (e) => {
      const q = e.target.closest('[data-qty]');
      const line = q?.closest('[data-line]');
      if (!line) return;
      // Lines come in the same order as the cart.
      const item = cart[Number(line.dataset.line)];
      if (item) {
        item.qty += Number(q.dataset.qty);
        if (item.qty <= 0) cart = cart.filter((c) => c !== item);
        save();
      }
      if (!cart.length) close(); else openCart();
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); send(form); });
  }

  async function send(form) {
    const err = form.querySelector('.ol-cart-error');
    const fail = (text) => { err.textContent = text; err.hidden = false; };
    const f = form.elements;
    const name = f.name.value.trim();
    const phone = f.phone?.value.trim() || '';
    if (!name) { f.name.focus(); return fail(ERRORS.missing_name()); }
    if (d.askPhone && phone.replace(/\D/g, '').length < 6) { f.phone.focus(); return fail(ERRORS.missing_phone()); }
    if (preview) return fail('Orders can’t be sent from the preview. Open your page to try it.');
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      const res = await fetch(`${api}/api/public/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          pageId, blockId, name, phone, website: f.website.value,
          pickup: f.pickup?.value || 'asap', note: f.note?.value.trim() || '',
          items: cart.map((l) => ({ id: l.id, qty: l.qty, extras: l.extras })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.error === 'sold_out') { cart = cart.filter((l) => product(l.id)?.name !== body.product); save(); }
        const msg = (ERRORS[res.status === 429 ? 'rate_limited' : body.error] || (() => 'Your order could not be sent. Try again.'))(body);
        if (body.error === 'sold_out') { openCart(msg); return; }
        fail(msg);
        return;
      }
      store.set('ol-me', { name, phone });
      const mine = (store.get(ordersKey) || []).filter((o) => Date.now() - o.at < 864e5);
      mine.push({ id: body.order.id, token: body.token, code: body.order.code, blockId, at: Date.now() });
      store.set(ordersKey, mine);
      cart = [];
      save();
      done(body.order);
      track();
    } catch {
      fail('Your order could not be sent. Check your connection and try again.');
    } finally {
      btn.disabled = false;
    }
  }

  function done(order) {
    const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(orderText(order, d, lang))}` : '';
    open(`<div class="ol-cart-done"><span class="ol-cart-ok" aria-hidden="true">${icon('check', 28)}</span>`
      + `<p class="ol-cart-h">Order <span class="notranslate" translate="no">#${esc(order.code)}</span></p>`
      + (d.thanks ? `<p class="ol-cart-sub">${esc(d.thanks)}</p>` : '')
      + `<p class="ol-cart-sub"><strong class="notranslate" translate="no">${esc(money(order.total))}</strong> · ${order.pickup === 'asap' ? 'Pickup as soon as possible' : `Pickup at ${esc(formatMinutes(toMin(order.pickup), locale))}`}</p>`
      + (waHref ? `<a class="ol-cart-wa" href="${esc(waHref)}" target="_blank" rel="noopener noreferrer">${icon('message', 16)}Also send it by WhatsApp</a>` : '')
      + '<button type="button" class="ol-cart-main" data-close>OK</button></div>', 'Order sent');
  }

  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  bar.addEventListener('click', () => openCart());
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const p = product(b.dataset.add);
    if (!p) return;
    if (parseExtras(p.extras).length) { openItem(p); return; }
    add(p.id, [], 1);
    b.classList.remove('is-added');
    void b.offsetWidth; // restart the little animation
    b.classList.add('is-added');
  });

  // ── Status of the visitor's orders ─────────────────────────
  const slot = el.querySelector('.ol-order-slot');
  let timer = null;
  let lastStatus = {};
  async function track() {
    clearTimeout(timer);
    if (!slot || preview || !el.isConnected) return;
    const mine = (store.get(ordersKey) || []).filter((o) => o.blockId === blockId && Date.now() - o.at < 864e5);
    if (!mine.length) { slot.innerHTML = ''; return; }
    const results = await Promise.all(mine.map((o) => fetch(`${api}/api/public/orders/${encodeURIComponent(o.id)}?token=${encodeURIComponent(o.token)}`)
      .then((r) => (r.ok ? r.json() : r.status === 404 ? { gone: true } : null)).then((b) => ({ o, b })).catch(() => ({ o, b: null }))));
    // Forget orders the server no longer knows, and finished ones after 2 hours.
    const keep = results.filter(({ o, b }) => !b?.gone && !(b?.order && !ACTIVE.includes(b.order.status) && Date.now() - o.at > 2 * 3600e3));
    store.set(ordersKey, [...(store.get(ordersKey) || []).filter((o) => o.blockId !== blockId), ...keep.map((k) => k.o)]);
    const shown = keep.filter((k) => k.b?.order && !k.o.dismissed);
    slot.innerHTML = shown.map(({ o, b }) => trackCard(o, b.order)).join('');
    for (const { b } of shown) {
      if (lastStatus[b.order.id] && lastStatus[b.order.id] !== 'ready' && b.order.status === 'ready') navigator.vibrate?.([200, 100, 200]);
      lastStatus[b.order.id] = b.order.status;
    }
    if (shown.some(({ b }) => ACTIVE.includes(b.order.status))) timer = setTimeout(track, doc.hidden ? 60_000 : 15_000);
  }
  function trackCard(o, order) {
    const i = STEPS.findIndex((s) => s.id === order.status);
    const cancelled = order.status === 'cancelled';
    const finished = order.status === 'done';
    const title = cancelled ? 'Cancelled' : finished ? 'Picked up — enjoy!' : STEPS[i]?.label || '';
    return `<div class="ol-order-track is-${esc(order.status)}" role="status"><div class="ol-order-top">`
      + `<p class="ol-order-code">Your order <span class="notranslate" translate="no">#${esc(order.code)}</span></p>`
      + `${ACTIVE.includes(order.status) ? '' : `<button type="button" class="ol-order-x" data-dismiss="${esc(o.id)}" aria-label="Hide">×</button>`}</div>`
      + `<p class="ol-order-status">${esc(title)}</p>`
      + (cancelled || finished ? '' : `<ol class="ol-order-steps">${STEPS.map((s, j) => `<li class="${j <= i ? 'is-done' : ''}">${esc(s.label)}</li>`).join('')}</ol>`)
      + '</div>';
  }
  slot?.addEventListener('click', (e) => {
    const x = e.target.closest('[data-dismiss]');
    if (!x) return;
    store.set(ordersKey, (store.get(ordersKey) || []).map((o) => (o.id === x.dataset.dismiss ? { ...o, dismissed: true } : o)));
    x.closest('.ol-order-track')?.remove();
  });
  const onVisible = () => { if (!doc.hidden) track(); };
  doc.addEventListener('visibilitychange', onVisible);

  // Re-render of the page (preview, language): remove what was added outside the block.
  const watcher = new MutationObserver(() => {
    if (!el.isConnected) { bar.remove(); sheet.remove(); clearTimeout(timer); doc.removeEventListener('visibilitychange', onVisible); doc.documentElement.classList.remove('ol-cart-lock'); watcher.disconnect(); }
  });
  watcher.observe(host.parentNode || host, { childList: true });

  refresh();
  track();
}

export const ORDER_CSS = `
.ol-root .ol-cat-add.is-added{animation:ol-cart-pop .35s ease}
@keyframes ol-cart-pop{40%{transform:scale(1.08)}}
.ol-root .ol-cart-bar{position:fixed;left:0;right:0;bottom:max(14px,env(safe-area-inset-bottom));z-index:40;display:flex;justify-content:center;padding:0 16px;pointer-events:none}
.ol-root .ol-cart-bar[hidden]{display:none}
.ol-root .ol-cart-open{pointer-events:auto;width:100%;max-width:calc(var(--ol-max-width) - 32px);display:flex;align-items:center;gap:10px;font:inherit;font-weight:700;border:0;border-radius:999px;padding:14px 18px;cursor:pointer;background:var(--ol-accent,var(--ol-surface-fg));color:var(--ol-accent-fg,var(--ol-surface));box-shadow:0 10px 30px -8px rgba(0,0,0,.45);animation:ol-cart-up .25s ease}
.ol-root .ol-cart-n{min-width:24px;height:24px;border-radius:999px;display:grid;place-items:center;font-size:.8em;background:var(--ol-accent-fg,var(--ol-surface));color:var(--ol-accent,var(--ol-surface-fg))}
.ol-root .ol-cart-label{flex:1;text-align:left}
@keyframes ol-cart-up{from{transform:translateY(20px);opacity:0}}
html.ol-cart-lock,html.ol-cart-lock body{overflow:hidden}
.ol-root .ol-cart-sheet{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center}
.ol-root .ol-cart-sheet[hidden]{display:none}
.ol-root .ol-cart-back{position:absolute;inset:0;background:rgba(0,0,0,.5)}
.ol-root .ol-cart-panel{position:relative;width:100%;max-width:520px;max-height:88vh;max-height:88dvh;overflow:auto;background:#fff;color:#18181b;border-radius:22px 22px 0 0;padding:22px 18px calc(18px + env(safe-area-inset-bottom));font-family:var(--ol-body-font);text-align:left;animation:ol-cart-up .25s ease}
@media (min-width:600px){.ol-root .ol-cart-sheet{align-items:center}.ol-root .ol-cart-panel{border-radius:22px}}
.ol-root .ol-cart-x{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:50%;background:#f4f4f5;color:#18181b;font-size:22px;line-height:1;cursor:pointer}
.ol-root .ol-cart-h{margin:0 40px 4px 0;font-family:var(--ol-title-font);font-weight:800;font-size:1.25em}
.ol-root .ol-cart-sub{margin:4px 0 0;opacity:.75;font-size:.9em;white-space:pre-line}
.ol-root .ol-cart-extras{border:0;margin:14px 0 0;padding:0;display:grid;gap:6px}
.ol-root .ol-cart-extras legend{font-weight:700;font-size:.85em;margin-bottom:6px;padding:0}
.ol-root .ol-cart-check{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:#f4f4f5;cursor:pointer}
.ol-root .ol-cart-check input{width:18px;height:18px;accent-color:#18181b;margin:0}
.ol-root .ol-cart-check span:nth-of-type(1){flex:1}
.ol-root .ol-cart-plus{font-size:.85em;font-weight:700;opacity:.75}
.ol-root .ol-cart-row{display:flex;gap:10px;align-items:center;margin-top:16px}
.ol-root .ol-qty{display:inline-flex;align-items:center;gap:2px;border-radius:999px;background:#f4f4f5;padding:3px;flex:none}
.ol-root .ol-qty button{width:30px;height:30px;border:0;border-radius:50%;background:#fff;color:#18181b;display:grid;place-items:center;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.12)}
.ol-root .ol-qty-n{min-width:24px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums}
.ol-root .ol-cart-main{flex:1;width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;font:inherit;font-weight:700;border:0;border-radius:999px;padding:14px 20px;cursor:pointer;background:#18181b;color:#fff}
.ol-root .ol-cart-main:disabled{opacity:.6;cursor:wait}
.ol-root .ol-cart-lines{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:8px}
.ol-root .ol-cart-line{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f2}
.ol-root .ol-cart-lname{flex:1;min-width:0;display:flex;flex-direction:column;font-weight:600}
.ol-root .ol-cart-lname small{font-weight:400;opacity:.7;font-size:.8em}
.ol-root .ol-cart-ltotal{min-width:64px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.ol-root .ol-cart-totalrow{display:flex;justify-content:space-between;margin:12px 0 6px;font-size:1.05em}
.ol-root .ol-cart-form{display:grid;gap:10px;margin-top:8px}
.ol-root .ol-cart-field{display:grid;gap:4px;font-size:.85em;font-weight:600}
.ol-root .ol-cart-field :is(input,select,textarea){font:inherit;font-size:16px;font-weight:400;padding:11px 12px;border:1px solid #d4d4d8;border-radius:12px;background:#fff;color:#18181b;width:100%}
.ol-root .ol-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.ol-root .ol-cart-error{margin:0;color:#b91c1c;font-size:.88em;font-weight:600}
.ol-root .ol-cart-error[hidden]{display:none}
.ol-root .ol-cart-done{display:grid;justify-items:center;text-align:center;gap:6px}
.ol-root .ol-cart-done .ol-cart-h{margin:6px 0 0}
.ol-root .ol-cart-ok{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:#dcfce7;color:#15803d}
.ol-root .ol-cart-wa{margin-top:10px;display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:999px;background:#25d366;color:#fff!important;font-weight:700;text-decoration:none}
.ol-root .ol-cart-done .ol-cart-main{margin-top:12px;justify-content:center}
.ol-root .ol-order-slot:empty{display:none}
.ol-root .ol-order-slot{display:grid;gap:8px;margin-bottom:10px}
.ol-root .ol-order-track{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:14px 16px;text-align:left;border-left:5px solid #f59e0b}
.ol-root .ol-order-track.is-ready{border-left-color:#16a34a}
.ol-root .ol-order-track.is-done{border-left-color:#a1a1aa}
.ol-root .ol-order-track.is-cancelled{border-left-color:#dc2626}
.ol-root .ol-order-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.ol-root .ol-order-code{margin:0;font-size:.8em;font-weight:700;opacity:.7}
.ol-root .ol-order-x{border:0;background:none;color:inherit;font-size:20px;line-height:1;cursor:pointer;opacity:.6}
.ol-root .ol-order-status{margin:2px 0 0;font-weight:800;font-size:1.1em}
.ol-root .is-ready .ol-order-status{color:#16a34a}
.ol-root .ol-order-steps{list-style:none;margin:10px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:.7em;font-weight:600}
.ol-root .ol-order-steps li{padding-top:7px;border-top:4px solid color-mix(in srgb,var(--ol-surface-fg) 15%,transparent);opacity:.6}
.ol-root .ol-order-steps li.is-done{border-top-color:#16a34a;opacity:1}`;
