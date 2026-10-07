// Catalog block: products with price, discount, stock, description and a
// buy link (or an order through WhatsApp). Shown as a button that opens the
// catalog, or always visible. Pro feature (see ../plans.js).
import { esc, safeUrl } from '../util/html.js';
import { imgStyle } from '../util/image.js';
import { icon } from '../icons.js';
import { toggleButton } from './_shared.js';
import { localTimeZone, timeZoneOptions } from '../booking.js';
import { zonedMinutes } from '../hours.js';
import { mountOrders, ORDER_CSS } from './catalog-orders.js';

/** "1,234.5" -> number formatting chosen in the block. */
export function formatMoney(n, d = {}) {
  const value = Math.round(Number(n) * 100) / 100;
  const decimals = Number.isInteger(value) ? 0 : 2;
  const loc = d.numberFormat === 'comma' ? 'de-DE' : 'en-US';
  const num = value.toLocaleString(loc, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const cur = d.currency || '';
  if (!cur) return num;
  return d.currencyPosition === 'after' ? `${num} ${cur}` : `${cur}${/[a-z.]$/i.test(cur) ? ' ' : ''}${num}`;
}

/** Final price after the discount. */
export const salePrice = (p) => Math.round(Number(p.price || 0) * (100 - Number(p.discount || 0))) / 100;

/** Stock as a number, or null when it is not shown. */
export const stockOf = (p) => (/^\d+$/.test(String(p.stock ?? '').trim()) ? Number(String(p.stock).trim()) : null);

export const waNumber = (tel) => String(tel || '').replace(/\D/g, '');

/** Menu tags of a product (dietary info and highlights). */
export const PRODUCT_TAGS = [
  { value: 'popular', label: 'Popular', emoji: '⭐' },
  { value: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥕' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'glutenFree', label: 'Gluten-free', emoji: '🌾' },
  { value: 'dairyFree', label: 'Dairy-free', emoji: '🥛' },
];

/**
 * Extras written one per line: "Extra cheese = 1.50", "Bacon +2", "No onion".
 * → [{ name, price }]
 */
export function parseExtras(text) {
  return String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 15).map((l) => {
    const m = l.match(/^(.*?)\s*(?:=|\+|:|\s)\s*\$?\s*(\d+(?:[.,]\d{1,2})?)\s*\$?$/);
    const name = (m ? m[1] : l).replace(/[=+:]\s*$/, '').trim().slice(0, 60);
    return name ? { name, price: m ? Number(m[2].replace(',', '.')) : 0 } : null;
  }).filter(Boolean);
}

/** Key of a product in the "Today" sold-out list. */
export const productKey = (blockId, productId) => `${blockId}:${productId}`;

/** Sold out: stock 0, or switched off for today in the dashboard. */
export const isSoldOut = (p, blockId, today) => stockOf(p) === 0 || Boolean(today?.soldOut?.includes(productKey(blockId, p.id)));

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Price an order from the block data (never from the visitor's numbers).
 * items: [{ id, qty, extras: [index of the product's extras] }]
 * → { lines: [{ id, name, qty, unit, extras: [{ name, price }], total }], total } or { error, product? }
 */
export function priceCart(d, items, { blockId, today } = {}) {
  if (!Array.isArray(items) || !items.length) return { error: 'empty' };
  if (items.length > 40) return { error: 'too_many' };
  const lines = [];
  for (const it of items) {
    const p = (d.products || []).find((x) => x.id === String(it?.id || '') && x.name);
    if (!p) return { error: 'unknown_product' };
    if (isSoldOut(p, blockId, today)) return { error: 'sold_out', product: p.name };
    const qty = Math.round(Number(it.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > 50) return { error: 'invalid_qty' };
    const all = parseExtras(p.extras);
    const picked = [...new Set(Array.isArray(it.extras) ? it.extras.map(Number) : [])].filter((i) => Number.isInteger(i) && all[i]).sort((a, b) => a - b);
    const extras = picked.map((i) => all[i]);
    const unit = round2((Number(p.discount) > 0 ? salePrice(p) : Number(p.price || 0)) + extras.reduce((s, e) => s + e.price, 0));
    lines.push({ id: p.id, name: p.name, qty, unit, extras, total: round2(unit * qty) });
  }
  return { lines, total: round2(lines.reduce((s, l) => s + l.total, 0)) };
}

const WA_WORDS = {
  en: { order: 'Order', total: 'Total', pickup: 'Pickup', asap: 'as soon as possible', name: 'Name', note: 'Note' },
  es: { order: 'Pedido', total: 'Total', pickup: 'Retiro', asap: 'lo antes posible', name: 'Nombre', note: 'Nota' },
};

/** An order as plain text (for WhatsApp), in the page language. */
export function orderText(order, d, lang = 'en') {
  const w = WA_WORDS[lang] || WA_WORDS.en;
  const money = (n) => formatMoney(n, d);
  return [
    `${w.order} #${order.code}`,
    ...order.lines.map((l) => `${l.qty} × ${l.name}${l.extras.length ? ` (${l.extras.map((e) => e.name).join(', ')})` : ''} — ${money(l.total)}`),
    `${w.total}: ${money(order.total)}`,
    `${w.pickup}: ${order.pickup && order.pickup !== 'asap' ? order.pickup : w.asap}`,
    order.name ? `${w.name}: ${order.name}` : '',
    order.note ? `${w.note}: ${order.note}` : '',
  ].filter(Boolean).join('\n');
}

/** Pickup times a visitor can choose (every 15 min from now + preparation time, until midnight). */
export function pickupTimes(d, now = Date.now()) {
  const tz = d.timezone || 'UTC';
  const start = Math.ceil((zonedMinutes(new Date(now), tz) + (Number(d.prepMinutes) || 15)) / 15) * 15;
  const out = [];
  for (let m = start; m < 1440 && out.length < 40; m += 15) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  return out;
}

const CATALOG_CSS = `.ol-root .ol-catalog{container-type:inline-size;display:flex;flex-direction:column;gap:10px;text-align:left}
.ol-root .ol-cat-head{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:14px 16px}
.ol-root .ol-cat-title{margin:0;font-family:var(--ol-title-font);font-weight:800;font-size:1.1em}
.ol-root .ol-cat-intro{margin:4px 0 0;font-size:.88em;opacity:.85;white-space:pre-line;line-height:1.45}
.ol-root .ol-cat-head .ol-cat-title+.ol-cat-intro{margin-top:4px}
.ol-root .ol-cat-head .ol-cat-intro:first-child{margin-top:0}
.ol-root .ol-cat-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ol-root .is-grid .ol-cat-list{grid-template-columns:repeat(2,minmax(0,1fr))}
.ol-root .ol-cat-item{position:relative;display:flex;flex-direction:column;background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);overflow:hidden;min-width:0}
.ol-root .is-list .ol-cat-item{flex-direction:row;align-items:stretch}
.ol-root .ol-cat-media{display:grid;place-items:center;aspect-ratio:1/1;overflow:hidden;background:color-mix(in srgb,var(--ol-surface-fg) 7%,transparent);color:color-mix(in srgb,var(--ol-surface-fg) 40%,transparent)}
.ol-root .is-list .ol-cat-media{width:96px;flex:none;align-self:flex-start}
.ol-root .ol-cat-media img{width:100%;height:100%;display:block;object-fit:cover}
.ol-root .ol-cat-badges{position:absolute;top:8px;left:8px;display:flex;flex-wrap:wrap;gap:4px;max-width:calc(100% - 16px)}
.ol-root .ol-cat-badge,.ol-root .ol-cat-off{font-size:.68em;font-weight:800;padding:3px 8px;border-radius:999px;line-height:1.3;background:var(--ol-surface-fg);color:var(--ol-surface)}
.ol-root .ol-cat-off{background:#dc2626;color:#fff}
.ol-root .ol-cat-info{flex:1;display:flex;flex-direction:column;gap:4px;padding:10px 12px 12px;min-width:0}
.ol-root .ol-cat-name{margin:0;font-weight:700;line-height:1.25;overflow-wrap:anywhere}
.ol-root .ol-cat-desc{margin:0;font-size:.8em;opacity:.78;line-height:1.4;white-space:pre-line;overflow-wrap:anywhere}
.ol-root .ol-cat-foot{margin-top:auto;padding-top:4px;display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:2px 8px}
.ol-root .ol-cat-prices{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 6px}
.ol-root .ol-cat-price{font-weight:800;font-size:1.05em;font-variant-numeric:tabular-nums}
.ol-root .ol-cat-old{font-size:.8em;opacity:.55;font-variant-numeric:tabular-nums}
.ol-root .ol-cat-stock{font-size:.72em;font-weight:700;opacity:.7}
.ol-root .ol-cat-stock.is-low{color:#d97706;opacity:1}
.ol-root .ol-cat-stock.is-out{color:#dc2626;opacity:1}
.ol-root .ol-cat-buy{margin-top:6px;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 14px;border-radius:999px;font-weight:700;font-size:.85em;text-decoration:none;background:var(--ol-surface-fg);color:var(--ol-surface)!important;transition:opacity .15s}
.ol-root a.ol-cat-buy:hover{opacity:.85}
.ol-root .ol-cat-buy svg{flex:none}
.ol-root .ol-cat-buy[aria-disabled]{opacity:.35;cursor:not-allowed}
.ol-root .ol-cat-item.is-soldout .ol-cat-media img{filter:grayscale(1);opacity:.6}
.ol-root .is-list .ol-cat-buy{align-self:flex-start}
@container (max-width:250px){.ol-root .is-grid .ol-cat-list{grid-template-columns:minmax(0,1fr)}}
.ol-root .ol-cat-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px;margin:0 -2px}
.ol-root .ol-cat-tabs::-webkit-scrollbar{display:none}
.ol-root .ol-cat-tab{flex:none;font:inherit;font-size:.85em;font-weight:700;border:0;border-radius:999px;padding:8px 14px;cursor:pointer;background:var(--ol-surface);color:var(--ol-surface-fg)}
.ol-root .ol-cat-tab[aria-pressed="true"]{background:var(--ol-surface-fg);color:var(--ol-surface)}
.ol-root .ol-cat-sec{display:flex;flex-direction:column;gap:8px}
.ol-root .ol-cat-sec[hidden]{display:none}
.ol-root .ol-cat-sec+.ol-cat-sec{margin-top:6px}
.ol-root .ol-cat-sectitle{margin:0;font-family:var(--ol-title-font);font-weight:800;font-size:1.05em;color:var(--ol-text-color)}
.ol-root .ol-cat-tags{margin:0;display:flex;flex-wrap:wrap;gap:4px}
.ol-root .ol-cat-tag{font-size:.68em;font-weight:700;padding:2px 7px;border-radius:999px;background:color-mix(in srgb,var(--ol-surface-fg) 9%,transparent)}
.ol-root .ol-cat-allergens{margin:0;font-size:.74em;opacity:.7;font-style:italic}
.ol-root .ol-cat-extras{margin:0;font-size:.74em;opacity:.75}
.ol-root .ol-cat-paused{margin:0;padding:12px 14px;border-radius:var(--ol-surface-radius);background:#fef3c7;color:#92400e;font-weight:600;font-size:.9em;text-align:center}
.ol-root button.ol-cat-buy{font:inherit;font-weight:700;font-size:.85em;border:0;cursor:pointer}
.ol-root .ol-cat-count{min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--ol-surface);color:var(--ol-surface-fg);font-size:.8em;display:inline-grid;place-items:center}
.ol-root .ol-cat-count[hidden]{display:none}` + ORDER_CSS;

const pickup = { key: 'ordering', equals: 'pickup' };
const links = { key: 'ordering', equals: 'links' };

export default {
  type: 'catalog',
  label: 'Catalog',
  description: 'Products or a menu with prices, categories and extras. Visitors buy with a link, order on WhatsApp or place pickup orders.',
  icon: 'bag',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-catalog', description: 'Catalog wrapper (.is-grid or .is-list)' },
    { selector: '.ol-cat-head', description: 'Title and description above the products' },
    { selector: '.ol-cat-tabs', description: 'Category tabs' },
    { selector: '.ol-cat-sec', description: 'One category (title + products)' },
    { selector: '.ol-cat-item', description: 'One product (.is-soldout when sold out)' },
    { selector: '.ol-cat-media', description: 'Product image' },
    { selector: '.ol-cat-badge', description: 'Product label (e.g. New)' },
    { selector: '.ol-cat-off', description: 'Discount label (e.g. -20%)' },
    { selector: '.ol-cat-name', description: 'Product name' },
    { selector: '.ol-cat-tags', description: 'Menu tags (Spicy, Vegan…)' },
    { selector: '.ol-cat-desc', description: 'Product description' },
    { selector: '.ol-cat-allergens', description: 'Allergens text' },
    { selector: '.ol-cat-price', description: 'Final price' },
    { selector: '.ol-cat-old', description: 'Price before the discount' },
    { selector: '.ol-cat-stock', description: 'Stock text (.is-low, .is-out)' },
    { selector: '.ol-cat-buy', description: 'Buy / Order / Add button' },
    { selector: '.ol-cart-bar', description: 'Pickup orders: the “View order” bar' },
    { selector: '.ol-cart-sheet', description: 'Pickup orders: the order panel' },
    { selector: '.ol-order-track', description: 'Pickup orders: status of the visitor’s order' },
  ],
  fields: [
    { key: 'display', type: 'choice', label: 'Show as', default: 'button', options: [
      { value: 'button', label: 'Button that opens it' }, { value: 'always', label: 'Always visible' },
    ] },
    { key: 'buttonLabel', type: 'text', label: 'Button text', default: 'Catalog', showIf: { key: 'display', equals: 'button' } },
    { key: 'buttonSub', type: 'text', label: 'Button subtitle (optional)', placeholder: 'See products and prices', showIf: { key: 'display', equals: 'button' } },
    { key: 'startOpen', type: 'toggle', label: 'Start open', default: false, showIf: { key: 'display', equals: 'button' } },
    { key: 'title', type: 'text', label: 'Title (optional)', max: 80 },
    { key: 'description', type: 'textarea', label: 'Description (optional)', max: 400, placeholder: 'Shipping, payment methods, how to order…' },
    { key: 'products', type: 'list', label: 'Products', itemLabel: 'product', max: 80, fields: [
      { key: 'name', type: 'text', label: 'Name', required: true, max: 80 },
      { key: 'category', type: 'text', label: 'Category (optional)', max: 40, placeholder: 'Burgers, Drinks, Desserts…',
        help: 'Products with a category are grouped, with tabs to jump between categories.' },
      { key: 'image', type: 'image', label: 'Image (optional)' },
      { key: 'adjust', type: 'imageAdjust', label: 'Adjust image', image: 'image', frame: 'square', showIf: { key: 'image', truthy: true } },
      { key: 'description', type: 'textarea', label: 'Description (optional)', max: 400 },
      { key: 'price', type: 'number', label: 'Price', min: 0, max: 100000000, step: 0.01, default: 0, help: '0 = no price shown.' },
      { key: 'discount', type: 'range', label: 'Discount', min: 0, max: 95, step: 5, default: 0, unit: '%' },
      { key: 'tags', type: 'tags', label: 'Tags (optional)', options: PRODUCT_TAGS.map((t) => ({ value: t.value, label: `${t.emoji} ${t.label}` })) },
      { key: 'allergens', type: 'text', label: 'Allergens (optional)', max: 120, placeholder: 'Contains: milk, eggs, nuts' },
      { key: 'extras', type: 'textarea', label: 'Extras (optional)', max: 800, placeholder: 'Extra cheese = 1.50\nBacon = 2\nNo onion',
        help: 'One per line, with its price after “=” (no price = free). Visitors pick them when they order.' },
      { key: 'stock', type: 'text', label: 'Stock (optional)', max: 7, placeholder: 'e.g. 12',
        help: 'Units available. 0 = Sold out. Empty = stock is not shown. For a quick “sold out today”, use the Today tab.' },
      { key: 'badge', type: 'text', label: 'Label (optional)', max: 20, placeholder: 'New, Best seller…' },
      { key: 'url', type: 'url', label: 'Link (optional)', help: 'Product or checkout page. Without a link, the WhatsApp order is used (if set).' },
    ], default: [
      { id: 'p1', name: 'Product name', category: '', image: '', description: 'A short description of the product.', price: 25, discount: 0, tags: [], allergens: '', extras: '', stock: '', badge: 'New', url: '' },
    ] },
    { key: 'layout', type: 'choice', label: 'Layout', default: 'grid', options: [
      { value: 'grid', label: 'Grid (2 per row)' }, { value: 'list', label: 'List' },
    ] },
    { key: 'categoryTabs', type: 'toggle', label: 'Category tabs', default: true, help: 'Shown when products have a category.' },
    { key: 'currency', type: 'text', label: 'Currency', default: '$', max: 6, placeholder: '$, €, Bs., USD', translate: false },
    { key: 'currencyPosition', type: 'select', label: 'Currency position', default: 'before', options: [
      { value: 'before', label: 'Before the price ($25)' }, { value: 'after', label: 'After the price (25 €)' },
    ] },
    { key: 'numberFormat', type: 'select', label: 'Number format', default: 'dot', options: [
      { value: 'dot', label: '1,234.50' }, { value: 'comma', label: '1.234,50' },
    ] },
    { key: 'lowStock', type: 'range', label: 'Show “Only N left” from', min: 0, max: 20, default: 5, help: '0 = never.' },
    { key: 'ordering', type: 'choice', label: 'How visitors order', default: 'links', options: [
      { value: 'links', label: 'Links / WhatsApp' }, { value: 'pickup', label: 'Pickup orders' },
    ], help: 'Pickup orders: visitors fill a cart and send the order. You get it in the Orders tab (with a notification) and mark it as preparing and ready.' },
    { key: 'buyLabel', type: 'text', label: 'Buy button text', default: 'Buy', max: 24, showIf: links },
    { key: 'whatsapp', type: 'tel', label: 'WhatsApp number (optional)', placeholder: '+58 412 123 4567',
      help: 'Links / WhatsApp: products without a link get a button that opens WhatsApp with the order. Pickup orders: visitors can also send their order to this number.' },
    { key: 'orderMessage', type: 'text', label: 'WhatsApp message', max: 200, default: 'Hi! I would like to order: {product} ({price})',
      showIf: links, help: '{product} and {price} are replaced by the product name and price.' },
    { key: 'addLabel', type: 'text', label: '“Add” button text', default: 'Add', max: 24, showIf: pickup },
    { key: 'askPhone', type: 'toggle', label: 'Ask for a phone number', default: true, showIf: pickup },
    { key: 'pickupLater', type: 'toggle', label: 'Visitors can choose a pickup time', default: true, showIf: pickup, help: 'Otherwise every order is “as soon as possible”.' },
    { key: 'prepMinutes', type: 'range', label: 'Preparation time', min: 5, max: 120, step: 5, default: 15, unit: ' min', showIf: pickup,
      help: 'The first pickup time visitors can choose.' },
    { key: 'allowNotes', type: 'toggle', label: 'Visitors can add a note', default: true, showIf: pickup },
    { key: 'thanks', type: 'textarea', label: 'Message after ordering', max: 300, default: 'Thanks! Keep this page open to see when your order is ready.', showIf: pickup },
    { key: 'timezone', type: 'select', label: 'Your time zone', default: localTimeZone(), options: timeZoneOptions, showIf: pickup },
  ],
  summary: (d) => `${d.ordering === 'pickup' ? 'Pickup orders · ' : d.display === 'button' ? 'Button · ' : ''}${d.products.length} product${d.products.length === 1 ? '' : 's'}`,
  render(d, ctx) {
    const today = ctx.page?.today;
    // Static exports have no server to send orders to: they keep the links.
    const ordering = d.ordering === 'pickup' && ctx.mode !== 'export';
    const paused = ordering && today?.ordersPaused;
    const items = (d.products || []).filter((p) => p.name);
    const wa = waNumber(d.whatsapp);
    const card = (p) => {
      const stock = stockOf(p);
      const out = isSoldOut(p, ctx.blockId, today);
      const price = Number(p.price) > 0;
      const off = price && Number(p.discount) > 0;
      const final = off ? salePrice(p) : Number(p.price);
      const priceText = price ? formatMoney(final, d) : '';
      const url = safeUrl(p.url);
      const extras = parseExtras(p.extras);
      const href = url || (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(String(d.orderMessage || '').replaceAll('{product}', p.name).replaceAll('{price}', priceText).replace(/\s*\(\)\s*$/, ''))}` : '');
      const img = p.image
        ? `<span class="ol-cat-media"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" style="${imgStyle(p.adjust)}"></span>`
        : `<span class="ol-cat-media ol-cat-noimg" aria-hidden="true">${icon('bag', 28)}</span>`;
      const badges = (p.badge || off)
        ? `<span class="ol-cat-badges">${p.badge ? `<span class="ol-cat-badge">${esc(p.badge)}</span>` : ''}${off ? `<span class="ol-cat-off notranslate" translate="no">-${Number(p.discount)}%</span>` : ''}</span>` : '';
      const stockHtml = out ? '<span class="ol-cat-stock is-out">Sold out</span>'
        : stock === null ? ''
          : d.lowStock && stock <= d.lowStock ? `<span class="ol-cat-stock is-low">Only ${stock} left</span>`
            : '<span class="ol-cat-stock">In stock</span>';
      const tags = (p.tags || []).map((t) => PRODUCT_TAGS.find((x) => x.value === t)).filter(Boolean);
      const tagsHtml = tags.length ? `<p class="ol-cat-tags">${tags.map((t) => `<span class="ol-cat-tag is-${t.value}"><span aria-hidden="true">${t.emoji}</span> ${esc(t.label)}</span>`).join('')}</p>` : '';
      let buy = '';
      if (ordering) {
        const addLabel = esc(d.addLabel || 'Add');
        buy = paused ? ''
          : out ? `<span class="ol-cat-buy" aria-disabled="true">${addLabel}</span>`
            : `<button type="button" class="ol-cat-buy ol-cat-add" data-add="${esc(p.id)}" aria-label="${addLabel}: ${esc(p.name)}">${icon('plus', 15)}${addLabel}<span class="ol-cat-count" hidden></span></button>`;
      } else {
        const buyLabel = esc(url || !wa ? d.buyLabel || 'Buy' : d.buyLabel && d.buyLabel !== 'Buy' ? d.buyLabel : 'Order');
        buy = !href ? ''
          : out ? `<span class="ol-cat-buy" aria-disabled="true">${buyLabel}</span>`
            : `<a class="ol-cat-buy" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}" aria-label="${buyLabel}: ${esc(p.name)}">${wa && !url ? icon('message', 15) : ''}${buyLabel}</a>`;
      }
      const extrasHtml = extras.length && !ordering
        ? `<p class="ol-cat-extras">+ ${extras.map((e) => esc(e.price ? `${e.name} (${formatMoney(e.price, d)})` : e.name)).join(', ')}</p>` : '';
      return `<li class="ol-cat-item${out ? ' is-soldout' : ''}" data-id="${esc(p.id)}">${img}${badges}<div class="ol-cat-info">`
        + `<p class="ol-cat-name">${esc(p.name)}</p>${tagsHtml}`
        + (p.description ? `<p class="ol-cat-desc">${esc(p.description)}</p>` : '')
        + (p.allergens ? `<p class="ol-cat-allergens">${esc(p.allergens)}</p>` : '')
        + extrasHtml
        + `<div class="ol-cat-foot">${price ? `<p class="ol-cat-prices notranslate" translate="no"><span class="ol-cat-price">${esc(priceText)}</span>${off ? `<s class="ol-cat-old">${esc(formatMoney(p.price, d))}</s>` : ''}</p>` : ''}${stockHtml}</div>`
        + `${buy}</div></li>`;
    };
    const head = d.title || d.description
      ? `<div class="ol-cat-head">${d.title ? `<p class="ol-cat-title">${esc(d.title)}</p>` : ''}${d.description ? `<p class="ol-cat-intro">${esc(d.description)}</p>` : ''}</div>` : '';
    // Group by category (in the order they first appear); products without one go first.
    const groups = [];
    for (const p of items) {
      const cat = (p.category || '').trim();
      let g = groups.find((x) => x.cat.toLowerCase() === cat.toLowerCase());
      if (!g) { g = { cat, items: [] }; groups.push(g); }
      g.items.push(p);
    }
    groups.sort((a, b) => (a.cat ? 1 : 0) - (b.cat ? 1 : 0));
    const named = groups.filter((g) => g.cat);
    const tabs = d.categoryTabs && named.length > 1
      ? `<div class="ol-cat-tabs" role="toolbar" aria-label="Categories"><button type="button" class="ol-cat-tab" data-cat="" aria-pressed="true">All</button>${named.map((g, i) => `<button type="button" class="ol-cat-tab" data-cat="${i}" aria-pressed="false">${esc(g.cat)}</button>`).join('')}</div>` : '';
    const list = !items.length
      ? (ctx.mode === 'preview' ? '<p class="ol-cat-intro">Add products to your catalog.</p>' : '')
      : named.length
        ? groups.map((g) => `<section class="ol-cat-sec"${g.cat ? ` data-cat="${named.indexOf(g)}"` : ' data-cat="none"'}>${g.cat ? `<p class="ol-cat-sectitle">${esc(g.cat)}</p>` : ''}<ul class="ol-cat-list">${g.items.map(card).join('')}</ul></section>`).join('')
        : `<ul class="ol-cat-list">${items.map(card).join('')}</ul>`;
    const pausedHtml = paused ? '<p class="ol-cat-paused">We’re not taking orders right now.</p>' : '';
    const orderAttrs = ordering && !paused
      ? ` data-order="1" data-api="${esc(ctx.apiBase || '')}" data-page="${esc(ctx.page?.id || '')}" data-block="${esc(ctx.blockId)}" data-mode="${esc(ctx.mode)}" data-lang="${esc(ctx.page?.settings?.language || 'en')}"` : '';
    const body = `<div class="ol-catalog is-${d.layout === 'list' ? 'list' : 'grid'}"${orderAttrs}>${head}${pausedHtml}${tabs}${list}</div>`;
    // The visitor's order status goes above the catalog (also when it is a closed button).
    const track = ordering ? '<div class="ol-order-slot"></div>' : '';
    if (d.display === 'button') {
      const sub = d.buttonSub || `${items.length} product${items.length === 1 ? '' : 's'}`;
      return track + toggleButton({ ctx, iconName: 'bag', label: d.buttonLabel || d.title || 'Catalog', sub, body, open: d.startOpen, cls: 'ol-cat-toggle' });
    }
    return track + body;
  },
  hydrate(el, d, ctx) {
    // Category tabs.
    el.querySelectorAll('.ol-cat-tabs').forEach((bar) => bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cat]');
      if (!b) return;
      bar.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const cat = b.dataset.cat;
      el.querySelectorAll('.ol-cat-sec').forEach((s) => { s.hidden = cat !== '' && s.dataset.cat !== cat; });
    }));
    const root = el.querySelector('.ol-catalog[data-order]');
    if (root) mountOrders(el, root, d, ctx);
  },
  css: CATALOG_CSS,
};

